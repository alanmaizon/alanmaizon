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

variable "aws_region" {
  type    = string
  default = "eu-west-1"
}

variable "app_id" {
  type = string
}

variable "branch_name" {
  type = string
}

variable "domain_name" {
  type = string
}

# Amplify manages the certificate and DNS records in the existing Route 53 zone.
resource "aws_amplify_domain_association" "trellis" {
  app_id                 = var.app_id
  domain_name            = var.domain_name
  enable_auto_sub_domain = false
  wait_for_verification  = true

  sub_domain {
    branch_name = var.branch_name
    prefix      = ""
  }

  sub_domain {
    branch_name = var.branch_name
    prefix      = "www"
  }
}

output "url" {
  value = "https://${aws_amplify_domain_association.trellis.domain_name}"
}
