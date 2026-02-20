# deploy.yml Protection System

## Problem
The `.github/workflows/deploy.yml` file keeps getting corrupted (emptied) during sync operations, breaking GitHub Pages deployment.

## Root Causes
1. rsync conflicts during `copy-to-public.sh`
2. iCloud Drive interference (file attributes)
3. File permissions issues during sync

## Protection Layers

### 1. Source Repo Tracking (website-dev)
- `deploy.yml` is now committed and tracked in git
- Changes sync automatically via rsync
- Backup file: `.github/workflows/deploy.yml.backup`

### 2. Auto-Restore in Deployment Script
`scripts/deploy-direct.sh` now checks after sync:
```bash
if [ ! -s .github/workflows/deploy.yml ]; then
  git checkout HEAD -- .github/workflows/deploy.yml
fi
```

### 3. Git Hooks (Both Repos)

**pre-commit** - Blocks empty file commits:
- Detects if deploy.yml is empty in staged changes
- Auto-restores from git or backup
- Prevents corruption from being committed

**post-merge** - Auto-repairs after pulls:
- Runs after `git pull` or `git merge`
- Detects empty deploy.yml
- Restores from git history or backup
- Auto-commits the fix

### 4. Backup Files
Both repos have `.github/workflows/deploy.yml.backup`:
- Used when git restore fails
- Manually restorable: `cp deploy.yml.backup deploy.yml`

## Manual Recovery

If all else fails:
```bash
cd /path/to/website-public
cp .github/workflows/deploy.yml.backup .github/workflows/deploy.yml
git add .github/workflows/deploy.yml
git commit -m "fix: restore deploy.yml from backup"
git push origin main
```

## Testing Protection

Simulate corruption:
```bash
> .github/workflows/deploy.yml  # Empty the file
git add .github/workflows/deploy.yml
git commit -m "test"  # pre-commit hook should block this
```

Expected result: Commit blocked, file auto-restored.

## Status
✅ All protection layers active (Feb 20, 2026)
✅ Backup files in place (both repos)
✅ Git hooks installed (pre-commit + post-merge)
✅ Deploy script has auto-restore check

## Files Protected
- `website/.github/workflows/deploy.yml` (source, tracked in git)
- `website-public/.github/workflows/deploy.yml` (deployed, auto-restored)
- Both repos have `.backup` copies
