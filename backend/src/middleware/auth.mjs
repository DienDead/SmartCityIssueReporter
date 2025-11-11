import jwt from "jsonwebtoken"
import { config } from "../config.mjs"
import bcrypt from "bcryptjs"

export function signAdminJwt(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" })
}

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: "Unauthorized" })
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = decoded
    return next()
  } catch {
    return res.status(401).json({ error: "Invalid token" })
  }
}

export async function verifyAdminPassword(password) {
  if (config.adminPasswordHash) {
    return bcrypt.compare(password, config.adminPasswordHash)
  }
  if (config.adminPasswordPlain) {
    return password === config.adminPasswordPlain
  }
  return false
}
