import type { AwsCredentialIdentity } from "@aws-sdk/types"

export function getAppAwsCredentials(): AwsCredentialIdentity | undefined {
  const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) return undefined

  return {
    accessKeyId,
    secretAccessKey,
    sessionToken: process.env.APP_AWS_SESSION_TOKEN,
  }
}
