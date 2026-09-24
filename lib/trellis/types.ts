export type TrellisJobStatus = "queued" | "claimed" | "running" | "succeeded" | "failed"

export interface TrellisBenchmarkMetadata {
  referenceName?: string
  blenderScene?: string
  camera?: string
  knownDimensionsMm?: {
    width?: number
    height?: number
    depth?: number
  }
  notes?: string
}

export interface TrellisJobRecord {
  PK: string
  SK: "JOB"
  jobId: string
  status: TrellisJobStatus
  prompt?: string
  inputBucket: string
  inputKey: string
  outputBucket: string
  outputKey: string
  inputContentType: string
  inputFilename: string
  createdAt: string
  updatedAt: string
  claimedAt?: string
  startedAt?: string
  completedAt?: string
  failedAt?: string
  progress: number
  progressMessage: string
  workerId?: string
  workerMessageId?: string
  receiptHandle?: string
  error?: string
  inferenceSeconds?: number
  glbBytes?: number
  benchmark?: TrellisBenchmarkMetadata
}

export interface TrellisJobEvent {
  jobId: string
  createdAt: string
  status: TrellisJobStatus
}

export interface PublicTrellisJob {
  jobId: string
  status: TrellisJobStatus
  prompt?: string
  inputFilename: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  progress: number
  progressMessage: string
  error?: string
  inferenceSeconds?: number
  glbBytes?: number
  benchmark?: TrellisBenchmarkMetadata
  downloadUrl?: string
  artifactUrl?: string
}

export interface ClaimedTrellisJob {
  jobId: string
  inputUrl: string
  outputUrl: string
  receiptHandle: string
  prompt?: string
  benchmark?: TrellisBenchmarkMetadata
}
