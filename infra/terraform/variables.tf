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

variable "browser_origins" {
  description = "Exact web origins allowed to fetch signed GLB URLs. This does not make the bucket public."
  type        = list(string)
  default     = []
}
