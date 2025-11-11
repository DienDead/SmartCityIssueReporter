import express from "express"
import { query } from "../db.mjs"
import { upload } from "../middleware/upload.mjs"
import { requireAuth } from "../middleware/auth.mjs"
import { uploadBufferToCloudinary } from "../utils/cloudinary.mjs"
import { classifyIssue } from "../utils/classify.mjs"

export const reportsRouter = express.Router()

// GET /api/reports?category=&status=&sinceDays=30&search=&limit=500
reportsRouter.get("/", async (req, res) => {
  try {
    const { category, status, sinceDays = "30", search = "", limit = "500" } = req.query
    const days = Math.max(1, Math.min(365, Number(sinceDays) || 30))
    const lim = Math.max(1, Math.min(1000, Number(limit) || 500))

    const conds = []
    const params = []
    let idx = 1

    conds.push(`created_at >= NOW() - INTERVAL '${days} days'`)

    if (category && category !== "all") {
      conds.push(`category = $${idx++}`)
      params.push(category)
    }
    if (status && status !== "all") {
      conds.push(`status = $${idx++}`)
      params.push(status)
    }
    if (search) {
      conds.push(`(LOWER(title) LIKE $${idx} OR LOWER(description) LIKE $${idx})`)
      params.push(`%${String(search).toLowerCase()}%`)
      idx++
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : ""
    const sql = `
      SELECT id, title, description, category, status, auto_categorized, image_url,
             lat, lng, created_at
      FROM reports
      ${where}
      ORDER BY created_at DESC
      LIMIT ${lim}
    `
    const { rows } = await query(sql, params)
    return res.json(rows.map(mapRow))
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: "Server error" })
  }
})

// POST /api/reports  (multipart/form-data)
reportsRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      description,
      category: categoryInput,
      mode = "auto", // "auto" or "manual"
      lat,
      lng,
    } = req.body

    const latNum = Number(lat)
    const lngNum = Number(lng)

    if (!req.file) return res.status(400).json({ error: "Image is required" })
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res.status(400).json({ error: "Valid lat and lng are required" })
    }

    // 1) Upload image
    let imageUrl = ""
    try {
      const uploaded = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname)
      imageUrl = uploaded.secure_url
    } catch (e) {
      console.error("Cloudinary upload failed:", e)
      return res.status(500).json({ error: "Image upload failed" })
    }

    // 2) Category resolution
    let category = categoryInput
    let autoCategorized = false
    if (!category || mode === "auto") {
      const cls = await classifyIssue({
        title,
        description,
        fileBuffer: req.file.buffer,
        filename: req.file.originalname,
      })
      category = cls.category
      autoCategorized = true
    }

    if (!["pothole", "garbage", "other"].includes(category)) {
      return res.status(400).json({ error: "Invalid category" })
    }

    // 3) Insert into DB
    const { rows } = await query(
      `
      INSERT INTO reports (title, description, category, status, auto_categorized, image_url, lat, lng, geom, created_at)
      VALUES ($1, $2, $3, 'open', $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($7, $6), 4326), NOW())
      RETURNING id, title, description, category, status, auto_categorized, image_url, lat, lng, created_at
      `,
      [title || "Issue report", description || "", category, autoCategorized, imageUrl, latNum, lngNum],
    )

    return res.status(201).json(mapRow(rows[0]))
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: "Server error" })
  }
})

// PATCH /api/reports/:id/status  (admin)
reportsRouter.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body || {}
    if (!["open", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }
    const { rows } = await query(
      `
      UPDATE reports SET status=$2
      WHERE id=$1
      RETURNING id, title, description, category, status, auto_categorized, image_url, lat, lng, created_at
      `,
      [id, status],
    )
    if (rows.length === 0) return res.status(404).json({ error: "Not found" })
    return res.json(mapRow(rows[0]))
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: "Server error" })
  }
})

// DELETE /api/reports/:id  (admin)
reportsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { rowCount } = await query(`DELETE FROM reports WHERE id=$1`, [id])
    if (rowCount === 0) return res.status(404).json({ error: "Not found" })
    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: "Server error" })
  }
})

// GET /api/reports/heatmap?bbox=minLng,minLat,maxLng,maxLat
// Optional: returns only points inside bbox
reportsRouter.get("/heatmap", async (req, res) => {
  try {
    const { bbox } = req.query
    let sql = `
      SELECT id, category, status, lat, lng, created_at
      FROM reports
      ORDER BY created_at DESC
      LIMIT 5000
    `
    const params = []
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = String(bbox)
        .split(",")
        .map((v) => Number(v.trim()))
      if ([minLng, minLat, maxLng, maxLat].some((v) => !Number.isFinite(v))) {
        return res.status(400).json({ error: "Invalid bbox" })
      }
      sql = `
        SELECT id, category, status, lat, lng, created_at
        FROM reports
        WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        ORDER BY created_at DESC
        LIMIT 5000
      `
      params.push(minLng, minLat, maxLng, maxLat)
    }
    const { rows } = await query(sql, params)
    return res.json(rows.map((r) => ({
      id: r.id,
      category: r.category,
      status: r.status,
      lat: Number(r.lat),
      lng: Number(r.lng),
      createdAt: r.created_at,
    })))
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: "Server error" })
  }
})

function mapRow(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    status: r.status,
    autoCategorized: r.auto_categorized,
    imageUrl: r.image_url,
    lat: Number(r.lat),
    lng: Number(r.lng),
    createdAt: r.created_at,
  }
}
