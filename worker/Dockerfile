FROM nvidia/cuda:12.1.1-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    ATTN_BACKEND=xformers \
    SPCONV_ALGO=native \
    TORCH_CUDA_ARCH_LIST="8.6;8.9" \
    MAX_JOBS=2 \
    PYTHONPATH=/opt/TRELLIS \
    HF_HOME=/cache/huggingface \
    TORCH_HOME=/cache/torch \
    U2NET_HOME=/cache/u2net

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python-is-python3 git build-essential ninja-build \
    libgl1 libglib2.0-0 libegl1 libgomp1 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN python -m pip install pip==24.3.1 setuptools==75.6.0 wheel==0.45.1 \
    && python -m pip install torch==2.4.0 torchvision==0.19.0 xformers==0.0.27.post2 \
       --index-url https://download.pytorch.org/whl/cu121

RUN git clone https://github.com/microsoft/TRELLIS.git /opt/TRELLIS \
    && cd /opt/TRELLIS \
    && git checkout 442aa1e1afb9014e80681d3bf604e8d728a86ee7 \
    && git submodule update --init --recursive

WORKDIR /opt/TRELLIS
COPY constraints.txt /opt/worker/constraints.txt
ENV PIP_CONSTRAINT=/opt/worker/constraints.txt
RUN bash -ec 'source ./setup.sh --basic' \
    && python -m pip install spconv-cu120==2.3.6 \
       kaolin==0.17.0 -f https://nvidia-kaolin.s3.us-east-2.amazonaws.com/torch-2.4.0_cu121.html

# Explicit architectures let CUDA extensions compile without a GPU during build.
RUN git clone https://github.com/NVlabs/nvdiffrast.git /opt/nvdiffrast \
    && cd /opt/nvdiffrast && git checkout 729261dc64c4241ea36efda84fbf532cc8b425b8 \
    && python -m pip install --no-build-isolation .
RUN git clone https://github.com/JeffreyXiang/diffoctreerast.git /opt/diffoctreerast \
    && cd /opt/diffoctreerast && git checkout b09c20b84ec3aace4729e6e18a613112320eca3a \
    && git submodule update --init --recursive \
    && python -m pip install --no-build-isolation .
RUN git clone https://github.com/autonomousvision/mip-splatting.git /opt/mip-splatting \
    && cd /opt/mip-splatting && git checkout dda02ab5ecf45d6edb8c540d9bb65c7e451345a9 \
    && git submodule update --init --recursive \
    && python -m pip install --no-build-isolation submodules/diff-gaussian-rasterization

COPY requirements.txt /opt/worker/requirements.txt
RUN python -m pip install -r /opt/worker/requirements.txt
COPY infer.py trellis_worker.py /opt/worker/
WORKDIR /opt/worker
CMD ["python", "trellis_worker.py", "--idle-exit-seconds", "900"]
