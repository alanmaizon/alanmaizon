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

data "aws_caller_identity" "current" {}

data "aws_subnet" "worker" {
  count = var.launch_worker ? 1 : 0
  id    = var.subnet_id
}

data "aws_ami" "gpu" {
  count       = var.launch_worker ? 1 : 0
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["Deep Learning Base OSS Nvidia Driver GPU AMI (Ubuntu 22.04)*"]
  }
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
  filter {
    name   = "state"
    values = ["available"]
  }
}

locals {
  name = "trellis-cloud-worker"
  worker_files = [
    "Dockerfile", "constraints.txt", "requirements.txt", "infer.py", "trellis_worker.py"
  ]
  cloud_config = {
    write_files = concat([
      for name in local.worker_files : {
        path        = "/opt/trellis-worker/${name}"
        permissions = "0644"
        content     = file("${path.module}/../../worker/${name}")
      }
      ], [
      {
        path        = "/opt/trellis-worker/bootstrap.sh"
        permissions = "0700"
        content     = file("${path.module}/bootstrap.sh")
      },
      {
        path        = "/opt/trellis-worker/start-worker.sh"
        permissions = "0700"
        content     = file("${path.module}/start-worker.sh")
      },
      {
        path        = "/etc/trellis-worker.conf"
        permissions = "0600"
        content     = <<-EOT
          TRELLIS_APP_URL=${jsonencode(var.app_url)}
          TRELLIS_TOKEN_PARAMETER=${jsonencode(var.token_parameter_name)}
          AWS_DEFAULT_REGION=${jsonencode(var.aws_region)}
        EOT
      },
      {
        path        = "/etc/systemd/system/trellis-stop.service"
        permissions = "0644"
        content     = "[Unit]\nDescription=Stop TRELLIS GPU session\n[Service]\nType=oneshot\nExecStart=/usr/sbin/poweroff\n"
      },
      {
        path        = "/etc/systemd/system/trellis-stop.timer"
        permissions = "0644"
        content     = "[Unit]\nDescription=Limit GPU session duration\n[Timer]\nOnBootSec=${var.max_session_minutes}min\nAccuracySec=1s\nUnit=trellis-stop.service\n[Install]\nWantedBy=timers.target\n"
      },
      {
        path        = "/etc/systemd/system/trellis-worker.service"
        permissions = "0644"
        content     = <<-EOT
          [Unit]
          Description=TRELLIS outbound GPU worker
          After=network-online.target docker.service
          Wants=network-online.target
          Requires=docker.service
          [Service]
          Type=simple
          ExecStart=/opt/trellis-worker/start-worker.sh
          Restart=on-failure
          RestartSec=30
          TimeoutStopSec=45
          ExecStop=-/usr/bin/docker stop --time 30 trellis-worker
          [Install]
          WantedBy=multi-user.target
        EOT
      }
    ])
    runcmd = [["/opt/trellis-worker/bootstrap.sh"]]
  }
}

resource "aws_security_group" "worker" {
  count       = var.launch_worker ? 1 : 0
  name_prefix = "${local.name}-"
  description = "Outbound worker: no inbound connections, managed through SSM"
  vpc_id      = data.aws_subnet.worker[0].vpc_id
  ingress     = []
  egress {
    description = "Download packages and models; call HTTPS API, S3 and SSM"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_iam_role" "worker" {
  count       = var.launch_worker ? 1 : 0
  name_prefix = "${local.name}-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  count      = var.launch_worker ? 1 : 0
  role       = aws_iam_role.worker[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "token" {
  count = var.launch_worker ? 1 : 0
  role  = aws_iam_role.worker[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameter"]
      Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${var.token_parameter_name}"
    }]
  })
}

resource "aws_iam_instance_profile" "worker" {
  count       = var.launch_worker ? 1 : 0
  name_prefix = "${local.name}-"
  role        = aws_iam_role.worker[0].name
}

resource "aws_instance" "worker" {
  count                                = var.launch_worker ? 1 : 0
  ami                                  = coalesce(var.ami_id, data.aws_ami.gpu[0].id)
  instance_type                        = var.instance_type
  subnet_id                            = var.subnet_id
  associate_public_ip_address          = true
  vpc_security_group_ids               = [aws_security_group.worker[0].id]
  iam_instance_profile                 = aws_iam_instance_profile.worker[0].name
  instance_initiated_shutdown_behavior = "stop"
  user_data_base64                     = base64gzip("#cloud-config\n${yamlencode(local.cloud_config)}")
  user_data_replace_on_change          = true

  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 150
    encrypted             = true
    delete_on_termination = true
  }
  lifecycle {
    precondition {
      condition     = var.subnet_id != null
      error_message = "Choose a public subnet with an Internet Gateway route before enabling the worker."
    }
  }
  depends_on = [aws_iam_role_policy.token, aws_iam_role_policy_attachment.ssm]
  tags = {
    Name    = local.name
    Project = "trellis-lab"
  }
}

output "instance_id" {
  value = try(aws_instance.worker[0].id, null)
}

output "launch_enabled" {
  value = var.launch_worker
}
