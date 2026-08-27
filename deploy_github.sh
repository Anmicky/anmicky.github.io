#!/usr/bin/env bash
# 一键同步公开页到 GitHub Pages 仓库
# 用法: ./deploy_github.sh "commit message"
set -e
SRC="$HOME/personal_work/website"
DST="$HOME/personal_work/website-github"
MSG="${1:-update site $(date +%F)}"
rsync -az --delete \
  --exclude='.git/' --exclude='private/' --exclude='README.md' --exclude='deploy_github.sh' --exclude='.probe_aliyun.sh' \
  "$SRC/" "$DST/"
cd "$DST"
git add -A
git commit -m "$MSG" || true
git push origin main
