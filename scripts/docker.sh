#!/bin/sh
# Build script for Docker image
# Run this from the repository root directory

# Change to the repository root (parent of scripts/)
cd "$(dirname "$0")/.." || exit 1

# Build the Docker image
docker build  --platform linux/amd64 -t sybadm/memos.v1.0 -f scripts/Dockerfile .
# docker build  --no-cache --platform linux/amd64 -t sybadm/memos.v1.0 -f scripts/Dockerfile .

# Tag the image
docker tag sybadm/memos.v1.0 registry.ajlab.uk/sybadm/memos.v1.0

# Push to registry
docker push registry.ajlab.uk/sybadm/memos.v1.0
