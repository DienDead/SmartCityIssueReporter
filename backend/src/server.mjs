import express from "express"
import helmet from "helmet"
import cors from "cors"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import { config, assertConfig } from "./config.mjs"
import { authRouter } from "./routes/auth.mjs"
import { reportsRouter } from "./routes/reports.mjs"

assertConfig()

const app = express()

app.set("trust proxy", false)
app.use(helmet())
app.use(
  cors({
    origin: config.corsOrigin === "*" ? true : config.corsOrigin,
    credentials: false,
  }),
)
app.use(express.json({ limit: "2mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"))

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
})
app.use(limiter)

app.get("/api/health", (req, res) => res.json({ ok: true }))
app.get("/api/version", (req, res) => res.json({ version: "1.0.0" }))

app.use("/api/auth", authRouter)
app.use("/api/reports", reportsRouter)

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({ error: "Internal Server Error" })
})

app.listen(config.port, () => {
  console.log(`API listening on port ${config.port}`)
})
