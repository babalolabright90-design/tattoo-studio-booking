import { v2 as cloudinary } from "cloudinary"
import { MAX_IMAGE_BYTES } from "@/lib/constants"

export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
)

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

type Sniffed = { mime: "image/jpeg" | "image/png" | "image/webp" } | null

/** Validates the real file signature rather than trusting the client-supplied type. */
export function sniffImage(buf: Buffer): Sniffed {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg" }
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { mime: "image/png" }
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP")
    return { mime: "image/webp" }
  return null
}

export async function uploadImageFile(
  file: File,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured) throw new Error("Image storage is not configured")
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) throw new Error("Images must be under 5 MB")
  const buffer = Buffer.from(await file.arrayBuffer())
  if (!sniffImage(buffer)) throw new Error("Only JPG, PNG or WebP images are allowed")

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: `tattoo-studio/${folder}`, resource_type: "image", allowed_formats: ["jpg", "png", "webp"] },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"))
          resolve({ url: result.secure_url, publicId: result.public_id })
        },
      )
      .end(buffer)
  })
}

export async function deleteImage(publicId: string | null | undefined): Promise<void> {
  if (!isCloudinaryConfigured || !publicId) return
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error("Cloudinary delete failed", error)
  }
}
