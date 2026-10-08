#!/bin/bash
# Runs once on first boot: installs Docker and prepares the app directory the
# CI/CD pipeline syncs into.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

# --- Docker Engine + Compose v2 plugin (from Docker's own apt repository) ---
apt-get update -y
apt-get install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

systemctl enable --now docker
usermod -aG docker ubuntu

# --- Swap ---
# t2.micro has 1 GiB of RAM. `next build` peaks above that, and without swap the
# dashboard image build is killed partway through.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# --- App directory for the deployment pipeline ---
mkdir -p /home/ubuntu/app
chown ubuntu:ubuntu /home/ubuntu/app

echo "Bootstrap complete: $(docker --version), $(docker compose version)"
