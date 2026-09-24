import { DeleteMessageCommand, ReceiveMessageCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs"
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { getDocClient } from "@/lib/aws"
import { getAppAwsCredentials } from "@/lib/aws-credentials"
import {
  TRELLIS_BUCKET_NAME,
  TRELLIS_QUEUE_URL,
  requireTrellisConfig,
} from "@/lib/trellis/config"
import type {
  ClaimedTrellisJob,
  PublicTrellisJob,
  TrellisBenchmarkMetadata,
  TrellisJobEvent,
  TrellisJobRecord,
  TrellisJobStatus,
} from "@/lib/trellis/types"

const AWS_REGION = process.env.APP_AWS_REGION || process.env.AWS_REGION || "us-east-1"
const awsClientConfig = { region: AWS_REGION, ...(getAppAwsCredentials() ? { credentials: getAppAwsCredentials() } : {}) }
const s3 = new S3Client(awsClientConfig)
const sqs = new SQSClient(awsClientConfig)

function tableName() {
  const value = process.env.TRELLIS_DYNAMODB_TABLE_NAME || process.env.DYNAMODB_TABLE_NAME || ""
  if (!value) throw new Error("TRELLIS_DYNAMODB_TABLE_NAME or DYNAMODB_TABLE_NAME is required")
  return value
}

export function publicJob(record: TrellisJobRecord): PublicTrellisJob {
  const done = record.status === "succeeded"
  return {
    jobId: record.jobId,
    status: record.status,
    prompt: record.prompt,
    inputFilename: record.inputFilename,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt,
    progress: record.progress,
    progressMessage: record.progressMessage,
    error: record.error,
    inferenceSeconds: record.inferenceSeconds,
    glbBytes: record.glbBytes,
    benchmark: record.benchmark,
    downloadUrl: done ? `/api/trellis/jobs/${record.jobId}/download` : undefined,
    artifactUrl: done ? `/api/trellis/jobs/${record.jobId}/artifact` : undefined,
  }
}

export async function createTrellisJob({
  image,
  filename,
  contentType,
  prompt,
  benchmark,
}: {
  image: Buffer
  filename: string
  contentType: string
  prompt?: string
  benchmark?: TrellisBenchmarkMetadata
}) {
  requireTrellisConfig()

  const jobId = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const ext = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png"
  const inputKey = `trellis/jobs/${jobId}/input.${ext}`
  const outputKey = `trellis/jobs/${jobId}/result.glb`

  await s3.send(
    new PutObjectCommand({
      Bucket: TRELLIS_BUCKET_NAME,
      Key: inputKey,
      Body: image,
      ContentType: contentType,
    }),
  )

  const record: TrellisJobRecord = {
    PK: `TRELLIS#JOB#${jobId}`,
    SK: "JOB",
    jobId,
    status: "queued",
    prompt,
    inputBucket: TRELLIS_BUCKET_NAME,
    inputKey,
    outputBucket: TRELLIS_BUCKET_NAME,
    outputKey,
    inputContentType: contentType,
    inputFilename: filename,
    createdAt,
    updatedAt: createdAt,
    progress: 0,
    progressMessage: "Queued for TRELLIS worker",
    benchmark,
  }

  await getDocClient().send(
    new PutCommand({
      TableName: tableName(),
      Item: record,
      ConditionExpression: "attribute_not_exists(PK)",
    }),
  )

  const event: TrellisJobEvent = { jobId, createdAt, status: "queued" }
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: TRELLIS_QUEUE_URL,
      MessageBody: JSON.stringify(event),
    }),
  )

  return publicJob(record)
}

export async function getTrellisJob(jobId: string) {
  const result = await getDocClient().send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: `TRELLIS#JOB#${jobId}`, SK: "JOB" },
    }),
  )

  return (result.Item as TrellisJobRecord | undefined) ?? null
}

export async function updateJobProgress({
  jobId,
  status,
  progress,
  message,
  workerId,
}: {
  jobId: string
  status?: Extract<TrellisJobStatus, "running" | "failed">
  progress: number
  message: string
  workerId?: string
}) {
  const updatedAt = new Date().toISOString()
  const setStatus = status ? "#status = :status," : ""
  await getDocClient().send(
    new UpdateCommand({
      TableName: tableName(),
      Key: { PK: `TRELLIS#JOB#${jobId}`, SK: "JOB" },
      UpdateExpression:
        `SET ${setStatus} progress = :progress, progressMessage = :message, updatedAt = :updatedAt, workerId = if_not_exists(workerId, :workerId), startedAt = if_not_exists(startedAt, :startedAt)`,
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ...(status ? { ":status": status } : {}),
        ":progress": progress,
        ":message": message,
        ":updatedAt": updatedAt,
        ":workerId": workerId,
        ":startedAt": updatedAt,
      },
    }),
  )
}

export async function completeJob({
  jobId,
  receiptHandle,
  ok,
  error,
  inferenceSeconds,
  glbBytes,
}: {
  jobId: string
  receiptHandle?: string
  ok: boolean
  error?: string
  inferenceSeconds?: number
  glbBytes?: number
}) {
  const now = new Date().toISOString()
  const optionalSets: string[] = []
  const expressionNames: Record<string, string> = { "#status": "status" }
  const optionalValues: Record<string, unknown> = {}

  if (ok) {
    optionalSets.push("completedAt = :completedAt")
    optionalValues[":completedAt"] = now
  } else {
    optionalSets.push("failedAt = :failedAt", "#error = :error")
    expressionNames["#error"] = "error"
    optionalValues[":failedAt"] = now
    optionalValues[":error"] = error || "TRELLIS generation failed"
  }

  if (inferenceSeconds !== undefined) {
    optionalSets.push("inferenceSeconds = :inferenceSeconds")
    optionalValues[":inferenceSeconds"] = inferenceSeconds
  }

  if (glbBytes !== undefined) {
    optionalSets.push("glbBytes = :glbBytes")
    optionalValues[":glbBytes"] = glbBytes
  }

  await getDocClient().send(
    new UpdateCommand({
      TableName: tableName(),
      Key: { PK: `TRELLIS#JOB#${jobId}`, SK: "JOB" },
      UpdateExpression:
        `SET #status = :status, progress = :progress, progressMessage = :message, updatedAt = :updatedAt${
          optionalSets.length ? `, ${optionalSets.join(", ")}` : ""
        }`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: {
        ":status": ok ? "succeeded" : "failed",
        ":progress": ok ? 100 : 0,
        ":message": ok ? "GLB ready" : error || "TRELLIS generation failed",
        ":updatedAt": now,
        ...optionalValues,
      },
    }),
  )

  if (receiptHandle) {
    await sqs.send(new DeleteMessageCommand({ QueueUrl: TRELLIS_QUEUE_URL, ReceiptHandle: receiptHandle }))
  }
}

export async function claimNextJob(workerId: string): Promise<ClaimedTrellisJob | null> {
  requireTrellisConfig()
  const response = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: TRELLIS_QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 15,
      VisibilityTimeout: 1800,
    }),
  )

  const message = response.Messages?.[0]
  if (!message?.Body || !message.ReceiptHandle) return null

  const event = JSON.parse(message.Body) as TrellisJobEvent
  const record = await getTrellisJob(event.jobId)
  if (!record) return null

  const now = new Date().toISOString()
  await getDocClient().send(
    new UpdateCommand({
      TableName: tableName(),
      Key: { PK: `TRELLIS#JOB#${event.jobId}`, SK: "JOB" },
      UpdateExpression:
        "SET #status = :status, progress = :progress, progressMessage = :message, updatedAt = :updatedAt, claimedAt = :claimedAt, workerId = :workerId, workerMessageId = :messageId, receiptHandle = :receiptHandle",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "claimed",
        ":progress": 5,
        ":message": `Claimed by ${workerId}`,
        ":updatedAt": now,
        ":claimedAt": now,
        ":workerId": workerId,
        ":messageId": message.MessageId,
        ":receiptHandle": message.ReceiptHandle,
      },
    }),
  )

  return {
    jobId: event.jobId,
    prompt: record.prompt,
    benchmark: record.benchmark,
    receiptHandle: message.ReceiptHandle,
    inputUrl: await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: record.inputBucket, Key: record.inputKey }),
      { expiresIn: 900 },
    ),
    outputUrl: await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: record.outputBucket, Key: record.outputKey, ContentType: "model/gltf-binary" }),
      { expiresIn: 900 },
    ),
  }
}

export async function getArtifactUrl(job: TrellisJobRecord) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: job.outputBucket,
      Key: job.outputKey,
      ResponseContentType: "model/gltf-binary",
      ResponseContentDisposition: `attachment; filename="${job.jobId}.glb"`,
    }),
    { expiresIn: 300 },
  )
}
