#!/bin/bash
set -euo pipefail
source /etc/trellis-worker.conf
export AWS_DEFAULT_REGION
umask 077

# Only the host has IAM credentials. No AWS keys or exposed server ports in Docker.
token=$(aws ssm get-parameter --name "$TRELLIS_TOKEN_PARAMETER" --with-decryption \
    --query Parameter.Value --output text)
if [[ ! "$token" =~ ^[a-zA-Z0-9_-]{32,256}$ ]]; then
    echo "Worker token must be a 32-256 character URL-safe secret" >&2
    exit 1
fi
printf 'TRELLIS_WORKER_TOKEN=%s\nTRELLIS_APP_URL=%s\nTRELLIS_WORKER_ID=ec2-%s\n' \
    "$token" "$TRELLIS_APP_URL" "$(hostname)" > /run/trellis-worker.env
unset token
trap 'rm -f /run/trellis-worker.env' EXIT

docker run --rm --gpus all --shm-size=2g \
    -v /var/lib/trellis-cache:/cache trellis-worker:local python infer.py --preload
docker run --rm --name trellis-worker --gpus all --shm-size=2g \
    --env-file /run/trellis-worker.env \
    -v /var/lib/trellis-cache:/cache trellis-worker:local

# Exit code 0 means the queue has stayed empty for 15 minutes.
/usr/sbin/poweroff
