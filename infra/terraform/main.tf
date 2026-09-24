terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name = "${var.project_name}-${var.environment}"
}

resource "aws_s3_bucket" "trellis" {
  bucket_prefix = "${local.name}-"
}

resource "aws_s3_bucket_cors_configuration" "trellis" {
  count  = length(var.browser_origins) > 0 ? 1 : 0
  bucket = aws_s3_bucket.trellis.id

  cors_rule {
    allowed_origins = var.browser_origins
    allowed_methods = ["GET", "HEAD"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "trellis" {
  bucket                  = aws_s3_bucket.trellis.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "trellis" {
  bucket = aws_s3_bucket.trellis.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "trellis" {
  bucket = aws_s3_bucket.trellis.id

  rule {
    id     = "expire-prototype-artifacts"
    status = "Enabled"

    expiration {
      days = var.artifact_retention_days
    }
  }
}

resource "aws_sqs_queue" "trellis" {
  name                       = "${local.name}-jobs"
  visibility_timeout_seconds = 1800
  message_retention_seconds  = 86400
}

resource "aws_dynamodb_table" "trellis" {
  name         = "${local.name}-jobs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }
}

resource "aws_iam_policy" "app" {
  name        = "${local.name}-app-policy"
  description = "Minimal permissions for the TRELLIS web/API prototype."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.trellis.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.trellis.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage"
        ]
        Resource = aws_sqs_queue.trellis.arn
      }
    ]
  })
}
