#!/usr/bin/env bash
set -euo pipefail

# Purpose: Deploy to staging branch (ALWAYS reuses same branch)
# Use this when you want PR review before deploying
# Usage: bash scripts/deploy-staging.sh "Commit message"

COMMIT_MSG="${1:-Update website}"
BRANCH="staging"  # Always use the same branch
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
PUBLIC="${BASE}/../website-public"

echo "=========================================="
echo "🚀 Deploying to staging branch (reusable)"
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
CHANGES=$(git status --porcelain | wc -l)
if [ "$CHANGES" -eq 0 ]; then
  echo "⚠️  No changes detected. Exiting."
  exit 0
fi

# Step 4: Switch to staging branch (create if doesn't exist)
echo ""
echo "🌿 Step 4: Updating staging branch..."
git fetch origin
if git rev-parse --verify "$BRANCH" 2>/dev/null; then
  # Branch exists locally
  git checkout "$BRANCH"
  git reset --hard origin/main  # Reset to match main
else
  # Branch doesn't exist locally, create from main
  git checkout -b "$BRANCH" origin/main
fi

# Step 5: Commit changes
echo ""
echo "📝 Step 5: Committing..."
git add -A
git commit -m "$COMMIT_MSG" || {
  echo "⚠️  No new changes to commit."
  exit 0
}

# Step 6: Force push (overwrites old staging)
echo ""
echo "📤 Step 6: Force pushing to staging..."
git push -f origin "$BRANCH"

echo ""
echo "=========================================="
echo "✅ Staging branch updated!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review PR: https://github.com/akios-ai/website/pull/[PR-NUMBER]"
echo "   (Create PR from 'staging' to 'main' if it doesn't exist)"
echo "2. Merge when ready → auto-deploys to https://akios.ai"
echo ""
echo "Note: This branch is REUSABLE. Next deployment overwrites it."
echo ""
