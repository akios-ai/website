#!/usr/bin/env bash
set -euo pipefail

# Purpose: Direct deployment - sync → build → push to main (no PR, no branches)
# Use this when you're the admin and want to deploy immediately
# Usage: bash scripts/deploy-direct.sh "Commit message"

COMMIT_MSG="${1:-Update website}"
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
PUBLIC="${BASE}/../website-public"

echo "=========================================="
echo "🚀 Direct deployment to main"
echo "=========================================="

# Step 1: Sync
echo ""
echo "📦 Step 1: Syncing..."
cd "$BASE"
bash scripts/copy-to-public.sh

# Step 2: Build
echo ""
echo "🔨 Step 2: Building..."
cd "$PUBLIC"
npm install --ignore-scripts 2>/dev/null || true
npm run build

# Step 3: Verify changes
echo ""
echo "✅ Step 3: Verifying changes..."
git checkout main 2>/dev/null || git switch main
CHANGES=$(git status --porcelain | wc -l)
if [ "$CHANGES" -eq 0 ]; then
  echo "⚠️  No changes detected. Exiting."
  exit 0
fi

# Step 4: Commit & push to main
echo ""
echo "📤 Step 4: Committing and pushing to main..."
git add -A
git commit -m "$COMMIT_MSG" || {
  echo "⚠️  No new changes to commit."
  exit 0
}

git push origin main

echo ""
echo "=========================================="
echo "✅ Deployed to main!"
echo "=========================================="
echo ""
echo "Live in ~2 minutes at: https://akios.ai"
echo ""
