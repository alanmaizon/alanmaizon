#!/usr/bin/env python3
"""Microsoft TRELLIS image-large adapter, shared by local and EC2 workers."""

import argparse
import os
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--preload", action="store_true")
    parser.add_argument("--seed", type=int, default=1)
    args = parser.parse_args()
    if not args.preload and (args.image is None or args.output is None):
        parser.error("--image and --output are required for generation")

    os.environ.setdefault("ATTN_BACKEND", "xformers")
    os.environ.setdefault("SPCONV_ALGO", "native")
    import rembg
    import torch
    from PIL import Image
    from trellis.pipelines import TrellisImageTo3DPipeline
    from trellis.utils import postprocessing_utils

    if not torch.cuda.is_available():
        raise RuntimeError("TRELLIS requires an NVIDIA GPU with a working CUDA driver")
    pipeline = TrellisImageTo3DPipeline.from_pretrained("microsoft/TRELLIS-image-large")
    pipeline.cuda()
    # Fetch all model weights before claiming a job with expiring S3 URLs.
    pipeline.rembg_session = rembg.new_session("u2net")
    if args.preload:
        print("TRELLIS model and background-removal weights ready", flush=True)
        return

    with Image.open(args.image) as image:
        outputs = pipeline.run(image, seed=args.seed, formats=["gaussian", "mesh"])
    glb = postprocessing_utils.to_glb(
        outputs["gaussian"][0],
        outputs["mesh"][0],
        simplify=0.95,
        texture_size=1024,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    glb.export(str(args.output))


if __name__ == "__main__":
    main()
