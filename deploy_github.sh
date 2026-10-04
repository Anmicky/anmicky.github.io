#!/usr/bin/env bash
# Publish only the reviewed public homepage assets. Internal auto-tree and private scripts are excluded.
set -euo pipefail
SRC="$HOME/personal_work/website"
DST="$HOME/personal_work/website-github"
MSG="${1:-update public site $(date +%F)}"
cd "$DST"
for file in index.html research_overview.json robots.txt sitemap.xml assets/homepage.css assets/public.js assets/image-wheel.png assets/experiment-design.png; do
  cp "$SRC/$file" "$DST/$file"
done
# The public research tree is curated here; never sync the internal auto-tree into Pages.
git add index.html research_overview.json tree_public.json robots.txt sitemap.xml assets/homepage.css assets/public.js assets/image-wheel.png assets/experiment-design.png
if ! git diff --cached --quiet; then git commit -m "$MSG"; fi
git push origin main
