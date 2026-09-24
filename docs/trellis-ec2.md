# Cloud GPU worker

The app can run entirely in AWS. EC2 replaces the WSL2 worker without changing the
web app or creating another queue:

```text
Browser -> Amplify web/API -> S3 image + DynamoDB job + SQS queue
                              ^
                              | authenticated outbound HTTPS polling
                              |
                     EC2 GPU + Microsoft TRELLIS
                              |
                              +-> signed S3 upload -> GLB download/Babylon preview
```

## Launch status and cost

The EC2 configuration is prepared, not deployed. No GPU has been launched. Real
CUDA builds and image-to-GLB inference still require the first GPU smoke test.

Read-only AWS checks on 2026-09-24 found no EC2 instances in `eu-west-1` and an
On-Demand G/VT quota (`L-DB2E81BA`) of zero. An increase to 8 vCPUs has now been
requested (request `cf250d83c31e4729b24735e248e302dfwpOz4G3x`, initially PENDING).
The proposed `g5.2xlarge` needs those 8 vCPUs. AWS must grant the increase before launch.

The default is one `g5.2xlarge` with an A10G GPU (24 GB advertised GPU memory),
32 GiB system RAM, and a 150 GiB encrypted gp3 root disk. The extra system RAM is
useful for compiling dependencies and loading models. AWS Price List API quotes
for Ireland at the time of preparation:

| Item | Price in USD, before tax |
| --- | --- |
| g5.2xlarge Linux On-Demand | $1.35296 per running hour |
| Two-hour GPU session | $2.71 compute, plus storage/network |
| 150 GiB gp3 disk | About $13.20 per full month retained |
| Continuous 730-hour compute | About $988/month, excluding storage/network |

Public IPv4, data transfer, and the existing web/API also have separate charges.
Stopping the instance stops compute charges, but the EBS disk remains billable.
G6 sizes were not offered in Ireland in the availability query; the module also
accepts full single-GPU G6 sizes for regions where available.

## Reproducible infrastructure

`infra/ec2-worker` is a separate Terraform root. It consumes the existing app URL
and public subnet. It does **not** provision or replace the deployed S3/SQS/table.
The default `launch_worker = false` creates no cloud resources. Changing it to
true and applying starts a paid GPU session.

The stack creates an instance profile, a security group with zero inbound rules,
and one GPU instance. There is no SSH key or public inference server. The public
IPv4 address is only for outbound Internet access without paying for a NAT
gateway. Administration uses AWS Systems Manager Session Manager.

The worker token is fetched at service startup from an existing SSM SecureString
parameter, using the instance role. It is never embedded in Terraform state,
user data, the Docker image, or Git. Use the AWS-managed `aws/ssm` encryption key.
The container gets the bearer token and signed S3 URLs, not AWS access keys.

Before launch:

1. Approve a GPU session budget and confirm the pending 8-vCPU increase for
   `Running On-Demand G and VT instances` in Ireland is granted. Quota approval is not an
   instance-capacity reservation.
2. Create `/trellis-lab/worker-token` as an SSM SecureString, with the exact same
   URL-safe secret as Amplify's `TRELLIS_WORKER_TOKEN`. Use the AWS console or a
   secret-aware script; never commit it or put it in a Terraform variable.
3. Copy `terraform.tfvars.example` to `terraform.tfvars`. Verify the account,
   subnet's Internet Gateway route, AMI, app URL, and session limit. The example
   pins the actual Ireland subnet/AMI observed on 2026-09-24.
4. Review the plan before applying with launch enabled:

```bash
terraform -chdir=infra/ec2-worker init
terraform -chdir=infra/ec2-worker validate
terraform -chdir=infra/ec2-worker plan -var='launch_worker=true' -out=worker.tfplan
# Only after launch approval:
terraform -chdir=infra/ec2-worker apply worker.tfplan
```

After creation, keep `launch_worker = true` for normal maintenance plans. Setting
it back to false plans removal of the worker and its disk, not a temporary stop.

The instance builds `worker/Dockerfile`, then preloads TRELLIS, DINOv2, and
background-removal weights before claiming a job. Initial installation can take
many minutes and uses billable GPU-instance time. The image/cache stay on EBS
across stops. Microsoft TRELLIS and native-extension Git commits, CUDA, PyTorch,
and important Python versions are pinned; this is not a complete transitive
dependency lock, so the first GPU build remains a required validation step.

## Stopping and restarting

The worker exits after 15 minutes of successfully observed empty queue, then the
host powers off. A systemd timer also powers off the instance 120 minutes after
each boot, including installation time. It is installed before dependency setup.
This hard session limit may interrupt an active job; the message becomes visible
again after the existing 30-minute queue visibility timeout. It is an operating
system guard, not an AWS billing cap or guarantee against host/bootstrap failure.

There is deliberately no automatic wake-up on a public upload. While stopped,
jobs queue until an operator starts EC2. This avoids a public endpoint starting
paid GPU sessions. The existing queue retains messages for one day.

```bash
aws ec2 start-instances --region eu-west-1 --instance-ids <instance-id>
aws ec2 stop-instances --region eu-west-1 --instance-ids <instance-id>
aws ssm start-session --region eu-west-1 --target <instance-id>
```

Inside Session Manager:

```bash
sudo tail -n 100 /var/log/cloud-init-output.log
sudo journalctl -u trellis-worker -n 100
sudo systemctl list-timers trellis-stop.timer
```

If the first build fails, inspect cloud-init output and re-run
`sudo /opt/trellis-worker/bootstrap.sh` within an approved session. If a container
name survived an unclean stop, remove that stopped container before restarting
the service. Updating worker source changes user data and plans instance
replacement, so review the plan and preserve any desired cache first.

Destroy this dedicated Terraform stack when finished to remove the instance,
root disk, and its IAM/security-group resources. The existing web/API data and
the separately provisioned SSM token are retained.

## First generation validation

1. Confirm `nvidia-smi` and a successful model preload in the service logs.
2. Upload one Blender render through the existing app URL.
3. Confirm queued -> claimed -> running -> succeeded and recorded duration/size.
4. Download the GLB, check that Babylon displays actual geometry, and rotate it.
5. Confirm the idle stop in EC2, then restart and verify another job.

The adapter runs the official `microsoft/TRELLIS-image-large` image pipeline,
exports gaussian/mesh outputs to a textured GLB, and uses seed 1. It does not
condition this image model on the optional text field. For repeatable comparisons,
use the same image, seed, model, and export settings. The existing duration metric
includes loading/transfer/export, not just GPU sampling. Inference subprocesses
have a ten-minute timeout to finish inside signed-upload URL expiry.

References: [Microsoft TRELLIS](https://github.com/microsoft/TRELLIS),
[AWS GPU instance specifications](https://docs.aws.amazon.com/ec2/latest/instancetypes/ac.html),
[EC2 stop/start behavior](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Stop_Start.html),
[NVIDIA container setup](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).
