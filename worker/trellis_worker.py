#!/usr/bin/env python3
"""Outbound TRELLIS worker for WSL2 or an EC2 GPU instance."""

from __future__ import annotations

import argparse
import os
import shlex
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

import requests


def request_json(method: str, url: str, token: str, **kwargs: Any) -> dict[str, Any]:
    response = requests.request(
        method,
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=kwargs.pop("timeout", 60),
        **kwargs,
    )
    response.raise_for_status()
    return response.json()


def report_progress(
    base_url: str, token: str, job_id: str, worker_id: str, progress: int, message: str
) -> None:
    request_json(
        "POST",
        f"{base_url}/api/trellis/worker/jobs/{job_id}/progress",
        token,
        json={"workerId": worker_id, "progress": progress, "message": message},
        timeout=30,
    )


def complete(
    base_url: str,
    token: str,
    job_id: str,
    receipt_handle: str,
    ok: bool,
    inference_seconds: float | None = None,
    glb_bytes: int | None = None,
    error: str | None = None,
) -> None:
    request_json(
        "POST",
        f"{base_url}/api/trellis/worker/jobs/{job_id}/complete",
        token,
        json={
            "ok": ok,
            "receiptHandle": receipt_handle,
            "inferenceSeconds": inference_seconds,
            "glbBytes": glb_bytes,
            "error": error,
        },
        timeout=30,
    )


def download(url: str, path: Path) -> None:
    with requests.get(url, stream=True, timeout=120) as response:
        response.raise_for_status()
        with path.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    handle.write(chunk)


def upload(url: str, path: Path) -> None:
    with path.open("rb") as handle:
        response = requests.put(
            url, data=handle, headers={"Content-Type": "model/gltf-binary"}, timeout=300
        )
    response.raise_for_status()


def run_trellis(
    command_template: str, input_path: Path, output_path: Path, prompt: str | None
) -> None:
    command = command_template.format(
        input=shlex.quote(str(input_path)),
        output=shlex.quote(str(output_path)),
        prompt=shlex.quote(prompt or ""),
    )
    # Keep inference inside the signed upload URL's 15-minute lifetime.
    subprocess.run(shlex.split(command), check=True, timeout=600)


def process_one(
    base_url: str, token: str, worker_id: str, command_template: str
) -> bool:
    claim = request_json(
        "POST",
        f"{base_url}/api/trellis/worker/claim",
        token,
        json={"workerId": worker_id},
        timeout=45,
    )
    job = claim.get("job")
    if not job:
        return False

    job_id = job["jobId"]
    receipt_handle = job["receiptHandle"]
    started = time.monotonic()

    with tempfile.TemporaryDirectory(prefix=f"trellis-{job_id}-") as tmp:
        workdir = Path(tmp)
        input_path = workdir / "input.png"
        output_path = workdir / "result.glb"

        try:
            report_progress(
                base_url, token, job_id, worker_id, 10, "Downloading reference image"
            )
            download(job["inputUrl"], input_path)

            report_progress(
                base_url, token, job_id, worker_id, 25, "Running TRELLIS inference"
            )
            run_trellis(command_template, input_path, output_path, job.get("prompt"))

            if not output_path.exists() or output_path.stat().st_size == 0:
                raise RuntimeError("TRELLIS command did not produce a non-empty GLB")

            report_progress(base_url, token, job_id, worker_id, 90, "Uploading GLB")
            upload(job["outputUrl"], output_path)

        except (
            requests.RequestException,
            subprocess.SubprocessError,
            OSError,
            RuntimeError,
        ) as exc:
            if isinstance(exc, requests.RequestException):
                error = "Image transfer or worker API request failed"
            elif isinstance(exc, subprocess.TimeoutExpired):
                error = "TRELLIS exceeded the 10-minute generation limit"
            elif isinstance(exc, subprocess.CalledProcessError):
                error = (
                    f"TRELLIS exited with status {exc.returncode}; check worker logs"
                )
            else:
                error = str(exc)
            complete(base_url, token, job_id, receipt_handle, ok=False, error=error)
            print(f"failed {job_id}: {error}", file=sys.stderr, flush=True)
        else:
            # An uncertain completion response must not overwrite success as failure.
            inference_seconds = time.monotonic() - started
            complete(
                base_url,
                token,
                job_id,
                receipt_handle,
                ok=True,
                inference_seconds=inference_seconds,
                glb_bytes=output_path.stat().st_size,
            )
            print(f"completed {job_id} in {inference_seconds:.1f}s", flush=True)

    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base-url", default=os.environ.get("TRELLIS_APP_URL", "http://localhost:3000")
    )
    parser.add_argument("--token", default=os.environ.get("TRELLIS_WORKER_TOKEN"))
    parser.add_argument(
        "--worker-id", default=os.environ.get("TRELLIS_WORKER_ID", "wsl2-rtx4070")
    )
    parser.add_argument(
        "--command",
        default=os.environ.get(
            "TRELLIS_COMMAND",
            f"{shlex.quote(sys.executable)} {shlex.quote(str(Path(__file__).with_name('infer.py')))} "
            "--image {input} --output {output}",
        ),
    )
    parser.add_argument("--once", action="store_true")
    parser.add_argument(
        "--idle-exit-seconds",
        type=int,
        default=0,
        help="Exit successfully after this much idle time; 0 keeps polling",
    )
    args = parser.parse_args()

    if not args.token:
        print("TRELLIS_WORKER_TOKEN is required", file=sys.stderr)
        return 2

    if args.idle_exit_seconds < 0:
        parser.error("--idle-exit-seconds cannot be negative")

    idle_since = time.monotonic()
    consecutive_errors = 0
    while True:
        try:
            did_work = process_one(
                args.base_url.rstrip("/"), args.token, args.worker_id, args.command
            )
            consecutive_errors = 0
        except requests.RequestException:
            # Do not print exceptions containing bearer tokens or signed URLs.
            consecutive_errors += 1
            print("Worker API unavailable; retrying", file=sys.stderr, flush=True)
            if args.once or consecutive_errors >= 5:
                return 1
            time.sleep(30)
            continue
        if args.once:
            return 0
        if did_work:
            idle_since = time.monotonic()
        else:
            if (
                args.idle_exit_seconds
                and time.monotonic() - idle_since >= args.idle_exit_seconds
            ):
                print("Idle limit reached", flush=True)
                return 0
            time.sleep(5)


if __name__ == "__main__":
    raise SystemExit(main())
