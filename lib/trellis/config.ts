export const TRELLIS_TABLE_NAME = process.env.TRELLIS_DYNAMODB_TABLE_NAME || process.env.DYNAMODB_TABLE_NAME || ""
export const TRELLIS_BUCKET_NAME = process.env.TRELLIS_S3_BUCKET_NAME || ""
export const TRELLIS_QUEUE_URL = process.env.TRELLIS_SQS_QUEUE_URL || ""
export const TRELLIS_WORKER_TOKEN = process.env.TRELLIS_WORKER_TOKEN || ""
export const TRELLIS_MAX_UPLOAD_BYTES = Number(process.env.TRELLIS_MAX_UPLOAD_BYTES || 10 * 1024 * 1024)

export function requireTrellisConfig() {
  const missing = [
    ["TRELLIS_DYNAMODB_TABLE_NAME or DYNAMODB_TABLE_NAME", TRELLIS_TABLE_NAME],
    ["TRELLIS_S3_BUCKET_NAME", TRELLIS_BUCKET_NAME],
    ["TRELLIS_SQS_QUEUE_URL", TRELLIS_QUEUE_URL],
  ].filter(([, value]) => !value)

  if (missing.length > 0) {
    throw new Error(`Missing TRELLIS configuration: ${missing.map(([name]) => name).join(", ")}`)
  }
}

export function requireWorkerToken(request: Request) {
  if (!TRELLIS_WORKER_TOKEN) {
    return false
  }

  const header = request.headers.get("authorization")
  return header === `Bearer ${TRELLIS_WORKER_TOKEN}`
}
