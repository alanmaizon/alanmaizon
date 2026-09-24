output "trellis_s3_bucket_name" {
  value = aws_s3_bucket.trellis.bucket
}

output "trellis_sqs_queue_url" {
  value = aws_sqs_queue.trellis.url
}

output "trellis_dynamodb_table_name" {
  value = aws_dynamodb_table.trellis.name
}

output "trellis_app_policy_arn" {
  value = aws_iam_policy.app.arn
}
