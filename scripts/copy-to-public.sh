#!/usr/bin/env bash
set -euo pipefail

# Purpose: copy ONLY the public site artifacts to the public repo.
# Strategy: allowlist includes; everything else is excluded by default.
# This script does NOT run git commands. Run from any dir; paths are relative
# to this script location (../website -> ../website-public).

# Allow overriding paths; default relative to this script's repo root
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
SRC="${SRC:-$BASE}"
DEST="${DEST:-$BASE/../website-public}"
REPO_URL="${REPO_URL:-https://github.com/akios-ai/website.git}"

if [[ ! -d "$SRC" ]]; then
  echo "Source dir not found: $SRC" >&2
  exit 1
fi

# Ensure destination repo exists (clone if missing)
if [[ ! -d "$DEST" ]]; then
  echo "Destination not found, cloning $REPO_URL into $DEST"
  git clone "$REPO_URL" "$DEST"
elif [[ ! -d "$DEST/.git" ]]; then
  echo "Destination exists but is not a git repo; remove or set DEST to an empty dir." >&2
  exit 1
fi

# Temporarily park .git to protect it from rsync --delete
GIT_SAFE_BACKUP="$(mktemp -d "${DEST%/}.gitbak.XXXX")"
trap 'rm -rf "$GIT_SAFE_BACKUP"' EXIT
mv "$DEST/.git" "$GIT_SAFE_BACKUP/.git"

# Regenerate diagrams so SVGs stay in sync with source (.mmd) before copying.
# Uses npx to fetch @mermaid-js/mermaid-cli on demand; no global install needed.
(cd "$SRC" && node internal/scripts/gen-arch.mjs)

rsync -av --delete --delete-excluded \
  --filter='P .git/' \
  --filter='P .git/***' \
  --include='LICENSE' \
  --include='README.md' \
  --include='package.json' \
  --include='package-lock.json' \
  --include='CNAME' \
  --include='.gitignore' \
  --include='.github/' \
  --include='.github/workflows/' \
  --include='.github/workflows/*.yml' \
  --include='.github/pull_request_template.md' \
  --include='scripts/' \
  --include='scripts/*.sh' \
  --include='internal/' \
  --include='internal/i18n/***' \
  --include='internal/scripts/***' \
  --exclude='internal/**' \
  --exclude='.archive/' \
  --include='partials/***' \
  --include='site/***' \
  --exclude='*' \
  "$SRC"/ "$DEST"/

# Restore .git
mv "$GIT_SAFE_BACKUP/.git" "$DEST/.git"
echo "Allowlisted copy complete (repo preserved)."
