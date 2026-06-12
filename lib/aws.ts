import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { awsCredentialsProvider } from "@vercel/functions/oidc"

const AWS_REGION = process.env.AWS_REGION || "us-east-1"
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || ""

let docClient: DynamoDBDocumentClient | null = null

export function getDocClient(): DynamoDBDocumentClient {
  if (docClient) return docClient

  const client = new DynamoDBClient({
    region: AWS_REGION,
    // Use Vercel OIDC federation when a role ARN is configured;
    // otherwise fall back to the default credential chain (local dev).
    ...(AWS_ROLE_ARN
      ? {
          credentials: awsCredentialsProvider({
            roleArn: AWS_ROLE_ARN,
            clientConfig: { region: AWS_REGION },
          }),
        }
      : {}),
  })

  docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  })

  return docClient
}
