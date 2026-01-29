#!/usr/bin/env bash
set -euo pipefail

# ⚠️  DEPRECATED: This script creates a new branch every time (not maintainable)
# Use one of these instead:
#   - scripts/deploy-direct.sh  (direct push to main, no PR)
#   - scripts/deploy-staging.sh (reusable staging branch for PR review)
# See: scripts/README-DEPLOYMENT.md

echo "=========================================="
echo "⚠️  WARNING: This script is DEPRECATED"
echo "=========================================="
echo ""
echo "This script creates a new branch for every deployment."
echo "Result: Too many branches (not maintainable)."
echo ""
echo "Use one of these instead:"
echo "  • bash scripts/deploy-direct.sh \"message\"  → push directly to main"
echo "  • bash scripts/deploy-staging.sh \"message\" → reusable staging branch"
echo ""
echo "See: scripts/README-DEPLOYMENT.md for details"
echo ""
read -p "Continue anyway? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Purpose: Complete end-to-end deployment: sync → build → commit → push → create PR → auto-deploy
# Usage: bash scripts/deploy-to-public.sh [branch-name] [title] [description]
# Example: bash scripts/deploy-to-public.sh feature/security-links "Fix FAQ security links" "Updated security policy references"

BRANCH="${1:-$(date +%s)}"  # default: timestamp branch name
TITLE="${2:-Update website}"
DESCRIPTION="${3:-Automated website update from private repo}"
PR_BODY="$DESCRIPTION"

BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
PUBLIC="${BASE}/../website-public"

echo "=========================================="
echo "🚀 Starting full website deployment workflow"
echo "=========================================="

# Step 1: Sync
echo ""
echo "📦 Step 1: Syncing private repo to public repo..."
cd "$BASE"
bash scripts/copy-to-public.sh

# Step 2: Build
echo ""
echo "🔨 Step 2: Building public website..."
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

# Step 4: Create branch & commit
echo ""
echo "🌿 Step 4: Creating branch and committing..."
git switch -c "$BRANCH" 2>/dev/null || git switch "$BRANCH"
git add -A
git commit -m "$TITLE" || {
  echo "⚠️  No new changes to commit."
  git switch main
  exit 0
}

# Step 5: Push
echo ""
echo "📤 Step 5: Pushing branch to GitHub..."
git push -u origin "$BRANCH"

# Step 6: Create PR (requires GITHUB_TOKEN env var)
echo ""
echo "📝 Step 6: Creating pull request..."
if command -v gh &> /dev/null; then
  if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "⚠️  GITHUB_TOKEN not set. Skipping PR creation."
    echo "    Run manually:"
    echo "    gh pr create --base main --head \"$BRANCH\" --title \"$TITLE\" --body \"$PR_BODY\""
  else
    gh pr create --base main --head "$BRANCH" --title "$TITLE" --body "$PR_BODY" 2>/dev/null || {
      echo "⚠️  PR creation failed. May already exist."
      echo "    Create manually at: https://github.com/akios-ai/website/compare/main...$BRANCH"
    }
  fi
else
  echo "⚠️  GitHub CLI (gh) not installed. Create PR manually:"
  echo "    https://github.com/akios-ai/website/compare/main...$BRANCH"
fi

echo ""
echo "=========================================="
echo "✅ Deployment prepared!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review PR at: https://github.com/akios-ai/website/pulls"
echo "2. Wait for CI checks (ci, deploy workflows) to pass"
echo "3. Request 1 approval from team"
echo "4. Merge to main → auto-deploys to https://akios.ai"
echo ""
