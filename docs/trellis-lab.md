# TRELLIS Image-to-3D Lab

This app replaces the home page with a practical Microsoft TRELLIS prototype:

1. A user uploads a PNG, JPEG, or WebP reference image.
2. The Next.js API stores the input in S3, creates a DynamoDB job record, and sends an SQS message.
3. A GPU worker polls the AWS-facing API over HTTPS using a bearer token.
4. The worker downloads the input through a short-lived signed URL, runs TRELLIS locally, uploads `result.glb` through a short-lived signed URL, and marks the job complete.
5. The browser polls job status and previews the GLB with Babylon.js.

The local GPU machine only makes outbound HTTPS requests. It does not need a public IP, inbound firewall rule, SSH tunnel, or exposed port.

For a fully cloud-based setup, see [the EC2 GPU worker](trellis-ec2.md). It uses
the same API and queue, with separate opt-in Terraform infrastructure.

## AWS resources

Terraform lives in `infra/terraform` and creates:

- private S3 bucket for input images and GLB outputs
- SQS queue for asynchronous jobs
- DynamoDB table for job records
- IAM policy with minimum app permissions

Prototype defaults are intentionally cheap: S3 lifecycle expiration is 7 days, DynamoDB is on-demand, and SQS is pay-per-use.

```bash
cd infra/terraform
terraform init
terraform apply
```

Set these environment variables on the hosted web/API runtime:

```bash
AWS_REGION=us-east-1
# Use APP_AWS_REGION instead on hosts that reserve AWS_* environment names.
APP_AWS_REGION=us-east-1
TRELLIS_DYNAMODB_TABLE_NAME=<terraform output trellis_dynamodb_table_name>
TRELLIS_S3_BUCKET_NAME=<terraform output trellis_s3_bucket_name>
TRELLIS_SQS_QUEUE_URL=<terraform output trellis_sqs_queue_url>
TRELLIS_WORKER_TOKEN=<long random secret>
```

If deploying on Vercel, continue using the existing `AWS_ROLE_ARN` OIDC pattern in `lib/aws.ts`. If deploying on AWS Amplify or App Runner, attach an IAM role with the Terraform output policy ARN.

If the hosting runtime cannot attach a role or use `AWS_*` environment names, set a tightly scoped key with custom names:

```bash
APP_AWS_ACCESS_KEY_ID=<least-privilege key id>
APP_AWS_SECRET_ACCESS_KEY=<least-privilege secret>
```

## Local Windows RTX 4070 worker with WSL2

On Windows:

1. Install a recent NVIDIA driver with WSL CUDA support.
2. Install WSL2 Ubuntu.
3. In Ubuntu, confirm the GPU is visible:

```bash
nvidia-smi
```

Install worker dependencies:

```bash
cd worker
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Install TRELLIS in WSL2 according to the Microsoft TRELLIS repository instructions. Keep it outside this web repo, for example `/opt/TRELLIS`, and confirm you can run a single image-to-GLB generation from the terminal.

Run the worker with the TRELLIS Python environment activated. The default now
uses the included `worker/infer.py` adapter with the official image-large model.
Make the external TRELLIS checkout importable and preload weights before claiming
a job:

```bash
export PYTHONPATH=/opt/TRELLIS
python worker/infer.py --preload
```

If your TRELLIS entrypoint differs, provide a template:

```bash
export TRELLIS_COMMAND='python /opt/TRELLIS/my_infer.py --input {input} --glb {output} --text {prompt}'
```

Command templates are executed as arguments, without a shell. Shell pipelines
should be put in a separate script. The official model requires at least 16 GB
GPU memory; the RTX 4070's 12 GB is below that requirement and may need separately
validated memory optimizations. The default EC2 A10G provides more headroom.

Run the worker:

```bash
export TRELLIS_APP_URL=https://<deployed-app-url>
export TRELLIS_WORKER_TOKEN=<same long random secret as the hosted app>
export TRELLIS_WORKER_ID=wsl2-rtx4070
python worker/trellis_worker.py
```

Use `--once` for a one-job smoke test.

## Benchmark workflow

For repeatable tests:

1. Build a simple known object in Blender, such as a cube, stool, cabinet, or chair.
2. Record dimensions in millimeters.
3. Render a square reference image from a fixed camera.
4. Upload the render in the app.
5. Fill the benchmark fields with the Blender object name and known dimensions.
6. Download the generated GLB and import it back into Blender for visual and geometric comparison.

The job record stores:

- status and progress
- original filename
- benchmark reference name
- known width, height, and depth in millimeters
- generation time
- GLB byte size

The next useful benchmark additions are a Blender validation script, silhouette comparison, and a small CSV export of job metadata.
