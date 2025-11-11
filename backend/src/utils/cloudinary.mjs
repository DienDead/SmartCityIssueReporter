import { v2 as cloudinary } from "cloudinary"
import { config } from "../config.mjs"

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  folder: config.cloudinary.folder
})

export async function uploadBufferToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: config.cloudinary.folder,
        resource_type: "image",
        public_id: filename ? filename.replace(/\.[^.]+$/, "") : undefined,
      },
      (err, result) => {
        if (err) return reject(err)
        resolve(result)
      },
    )
    stream.end(buffer)
  })
}
