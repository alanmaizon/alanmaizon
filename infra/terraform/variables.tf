variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "trellis-lab"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "artifact_retention_days" {
  type    = number
  default = 7
}

