import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  )
}

export function isAllowedImageType(contentType: string): boolean {
  return ALLOWED_CONTENT_TYPES.includes(contentType)
}

export { MAX_SIZE_BYTES }

function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const client = getR2Client()
  const bucket = process.env.R2_BUCKET_NAME!
  const publicBase = process.env.R2_PUBLIC_URL!.replace(/\/$/, '')

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: undefined, // Not enforced server-side in presigned URL
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 }) // 5 min
  const publicUrl = `${publicBase}/${key}`

  return { uploadUrl, publicUrl }
}
