# Website Deployment Scripts

This directory contains scripts for deploying the AKIOS website from the private repo to the public repo on GitHub.

## Scripts Overview

### `deploy-to-public.sh` (Recommended)
**Complete end-to-end deployment automation**

Handles all steps in one command:
1. Regenerates diagrams (mermaid → SVG)
2. Syncs allowlisted files to public repo
3. Builds the website (npm run build)
4. Creates feature branch and commits
5. Pushes to GitHub
6. **Automatically creates PR** (requires GITHUB_TOKEN)

**Usage:**
```bash
export GITHUB_TOKEN="ghp_xxx..."  # Set your GitHub token first
bash scripts/deploy-to-public.sh [branch-name] [title] [description]
```

**Examples:**
```bash
# With all parameters (recommended)
bash scripts/deploy-to-public.sh "feature/security-links" "Fix FAQ security links" "Updated security policy references"

# With defaults (auto-generated timestamp branch name)
bash scripts/deploy-to-public.sh

# With just branch name
bash scripts/deploy-to-public.sh "hotfix/typo-fix"
```

### `copy-to-public.sh`
**Sync only (manual PR creation)**

Syncs private repo files to public repo:
- Regenerates diagrams
- Copies allowlisted files only (no internal docs, node_modules, .archive, etc.)
- Preserves .git directory
- Includes CNAME for custom domain

**Usage:**
```bash
bash scripts/copy-to-public.sh
```

**Then manually:**
```bash
cd ../website-public
git status
git switch -c your-branch
git add .
git commit -m "Your message"
git push origin your-branch
# Create PR manually at GitHub UI
```

## Setup (One-time)

### 1. SSH Configuration
Ensure `~/.ssh/config` has the `github-akiosai` host configured:
```
Host github-akiosai
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_akios_deploy  # or your SSH key
  IdentitiesOnly yes
```

Test with:
```bash
ssh -T git@github-akiosai
```

### 2. Public Repo Clone
Scripts expect the public repo at:
```
../website-public
```

If it doesn't exist, the sync script will clone it automatically.

### 3. GitHub Token (for automated PR creation)
To enable automatic PR creation with `deploy-to-public.sh`:

1. **Create a Personal Access Token:**
   - Go to https://github.com/settings/tokens/new
   - **Token type:** Personal Access Token (classic)
   - **Scopes:** Check `repo` (full control of private repos)
   - Click "Generate token"

2. **Set for current session:**
   ```bash
   export GITHUB_TOKEN="ghp_xxx..."
   ```

3. **Or add to shell profile for persistence:**
   ```bash
   echo 'export GITHUB_TOKEN="ghp_xxx..."' >> ~/.zshrc
   source ~/.zshrc
   ```

## Deployment Process

### Automated (Recommended)
```bash
export GITHUB_TOKEN="ghp_xxx..."
bash scripts/deploy-to-public.sh "feature/my-change" "My change title" "What this does"
```

**Then:**
1. Watch for the PR in https://github.com/akios-ai/website/pulls
2. Wait for CI checks to pass (green checkmarks on `ci` and `deploy` workflows)
3. Request 1 approval from a team member
4. Merge PR → auto-deploys to https://akios.ai

### Manual (if automation not available)
```bash
bash scripts/copy-to-public.sh
cd ../website-public
npm install --ignore-scripts
npm run build
git switch -c feature/my-change
git add .
git commit -m "My message"
git push origin feature/my-change
```

Then manually create PR at: https://github.com/akios-ai/website/pulls

## What Gets Synced

**Included:**
- `site/` (all content, docs, blog pages)
- `partials/` (header, footer templates)
- `internal/scripts/` (build scripts, diagram generation)
- `internal/i18n/` (translations, language modules)
- `.github/workflows/` (CI/CD pipeline)
- `CNAME`, `LICENSE`, `NOTICE`, `README.md`, `package.json`, etc.

**Excluded:**
- `internal/docs/` (private documentation)
- `checklist-issues.md`, `tracking-issues.md` (internal tracking)
- `.archive/` (archived files)
- `node_modules/` (dependencies rebuilt in public repo)

## CI/CD Pipeline

After merge to `main`, GitHub Actions runs:
1. **ci workflow** — Builds the site, runs tests, validates structure
2. **deploy workflow** — If CI passes, deploys to GitHub Pages at https://akios.ai

Custom domain via `CNAME` file pointing to `akios.ai`.

## Troubleshooting

**PR creation fails with "Resource not accessible"**
- Set `GITHUB_TOKEN` environment variable
- Create new token at https://github.com/settings/tokens/new if needed
- Use at least `repo` scope

**Push rejected: "non-fast-forward"**
- Remote and local diverged
- Solution: `git pull --rebase origin hero-macro` then push again
- Or delete local branch and start fresh

**Build fails in public repo**
- Run `npm install` in website-public first
- Check for uncommitted changes: `git status`
- Verify site/*.mdx files exist

**Sync didn't copy all files**
- Check allowlist in `scripts/copy-to-public.sh`
- Files must match the rsync filter rules
- Run `bash scripts/copy-to-public.sh -v` for verbose output (if supported)

## Next Steps After Deploy

1. **Verify site deployed:** Visit https://akios.ai (and /fr/ for French)
2. **Check main branch:** Confirm PR was merged to https://github.com/akios-ai/website/tree/main
3. **Review CI logs:** Click workflow badges in PR for details if issues arise
4. **Monitor Pages:** Check GitHub Pages status in repo Settings → Pages
