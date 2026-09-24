#!/bin/bash
set -euo pipefail

# Arm the cost guard before installing packages or building CUDA extensions.
systemctl daemon-reload
systemctl enable --now trellis-stop.timer
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y awscli curl ca-certificates gnupg
if ! command -v docker >/dev/null; then
    apt-get install -y docker.io
fi
if ! command -v nvidia-ctk >/dev/null; then
    curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
        | gpg --dearmor --yes -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
    curl -fsSL https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
        | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
        > /etc/apt/sources.list.d/nvidia-container-toolkit.list
    apt-get update
    apt-get install -y nvidia-container-toolkit
fi
nvidia-ctk runtime configure --runtime=docker
systemctl enable --now docker
systemctl restart docker
nvidia-smi
mkdir -p /var/lib/trellis-cache
docker build --tag trellis-worker:local /opt/trellis-worker
systemctl enable --now trellis-worker.service
