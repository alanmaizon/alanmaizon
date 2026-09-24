variable "launch_worker" {
  description = "Explicit opt-in: applying with true starts a billable GPU instance."
  type        = bool
  default     = false
}

variable "aws_region" {
  type    = string
  default = "eu-west-1"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]+$", var.aws_region))
    error_message = "Use a standard AWS region name."
  }
}

variable "subnet_id" {
  description = "Existing public subnet in the same region, with Internet Gateway routing."
  type        = string
  default     = null
}

variable "ami_id" {
  description = "Pin an AWS Ubuntu 22.04 Deep Learning Base NVIDIA x86_64 AMI; null selects latest."
  type        = string
  default     = null
}

variable "instance_type" {
  type    = string
  default = "g5.2xlarge"
  validation {
    condition     = contains(["g5.xlarge", "g5.2xlarge", "g6.xlarge", "g6.2xlarge"], var.instance_type)
    error_message = "Use one of the supported single-GPU prototype sizes."
  }
}

variable "app_url" {
  type    = string
  default = "https://trellis-aws-prototype.d3lhjc99f3rc0a.amplifyapp.com"
  validation {
    condition     = can(regex("^https://[a-zA-Z0-9.-]+/?$", var.app_url))
    error_message = "Provide the app's HTTPS origin without a path."
  }
}

variable "token_parameter_name" {
  description = "Existing SSM SecureString using the AWS-managed SSM key; value must match the app token."
  type        = string
  default     = "/trellis-lab/worker-token"
  validation {
    condition     = can(regex("^/[a-zA-Z0-9/_-]+$", var.token_parameter_name))
    error_message = "Use an absolute SSM parameter path."
  }
}

variable "max_session_minutes" {
  type    = number
  default = 120
  validation {
    condition     = var.max_session_minutes >= 15 && var.max_session_minutes <= 120 && floor(var.max_session_minutes) == var.max_session_minutes
    error_message = "Prototype sessions must be between 15 and 120 whole minutes."
  }
}
