import dotenv from "dotenv"
dotenv.config()

const bool = (v, d = false) => {
  if (v === undefined) return d
  return String(v).toLowerCase() === "true"
}

export const config = {
  port: Number(8080),
  nodeEnv: "development",
  corsOrigin: "*",

  jwtSecret: process.env.JWT_SECRET,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  adminPasswordPlain: process.env.ADMIN_PASSWORD_PLAIN,

  db: {
    url: process.env.DATABASE_URL,
    ssl: bool(process.env.DATABASE_SSL, false),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: "smart-city-issues",
  },

  ml: {
    url: process.env.ML_API_URL,
    timeoutMs: Number(5000),
  },
}

export function assertConfig() {
  if (!config.db.url) throw new Error("DATABASE_URL is required")
  if (!config.jwtSecret) throw new Error("JWT_SECRET is required")
  if (!config.adminEmail) throw new Error("ADMIN_EMAIL is required")
  if (!config.adminPasswordHash && !config.adminPasswordPlain) {
    throw new Error("Provide ADMIN_PASSWORD_HASH or ADMIN_PASSWORD_PLAIN")
  }
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    // not fatal: you may run without image upload if front-end sends an absolute URL
    console.warn("Warning: Cloudinary env not fully set. Image uploads may fail.")
  }
}
