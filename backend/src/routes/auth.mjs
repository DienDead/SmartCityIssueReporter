import express from "express"
import { config } from "../config.mjs"
import { signAdminJwt, verifyAdminPassword } from "../middleware/auth.mjs"

export const authRouter = express.Router()

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" })
  if (email !== config.adminEmail) return res.status(401).json({ error: "Invalid credentials" })
  const ok = await verifyAdminPassword(password)
  if (!ok) return res.status(401).json({ error: "Invalid credentials" })
  const token = signAdminJwt({ sub: email, role: "admin" })
  return res.json({ token })
})
