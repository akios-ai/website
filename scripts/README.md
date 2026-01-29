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

## Branch Protection Rules (Rulesets)

The public repo (`akios-ai/website`) has **branch protection rules** on `main` to ensure stability and prevent accidental broken deployments.

### Why Branch Protection?

✅ Prevents direct pushes to `main` (forces PR review)  
✅ Requires CI checks to pass before merge  
✅ Prevents accidental deletion of main branch  
✅ Requires approvals before merging  
✅ Creates audit trail of all changes  
✅ Ensures production code is always stable  

### Recommended Rules (Enable These)

**Restrict updates** ✅
- Only allow users with bypass permission to push directly to main
- Forces all changes through PRs

**Restrict deletions** ✅
- Prevents accidental deletion of main branch
- Protects production history

**Require a pull request before merging** ✅
- Required approvals: `1` (at least one reviewer approval)
- Dismiss stale approvals: `ON` (new commits require new reviews)
- Require conversation resolution: `ON` (all comments must be addressed)
- Require review from Code Owners: `OFF` (unless CODEOWNERS file exists)

**Require status checks to pass** ✅
- Must pass: `ci` workflow (builds site, runs tests)
- Must pass: `deploy` workflow (validates deployment)
- Require branches to be up to date: `ON` (merge conflicts must be resolved first)

**Block force pushes** ✅
- Prevents `git push --force` to main
- Protects against accidental history rewrites

**Require signed commits** ❌ (Off)
- Only enable if all team members sign commits
- Most teams don't require this initially

**Require approval of the most recent reviewable push** ✅
- Ensures someone other than author approves

### Rules to Keep OFF

**Restrict creations** ❌
- Not needed once main branch exists
- Would prevent new PR branches

**Require linear history** ❌
- Too restrictive; prevents merge commits
- Keep off unless you enforce rebasing only

**Require deployments to succeed** ❌
- Unnecessary; deploy workflow runs after merge
- Would block merges unnecessarily

**Require code scanning results** ❌
- Only if CodeQL is configured
- Add later if needed

### Bypass List

Certain automations need to bypass rules to function:

**Who should be in the bypass list:**
- ✅ Automation bots (GitHub Actions, Copilot agents)
- ✅ Deployment service accounts
- ❌ Regular team members (should use PRs)

**Our setup:**
- `Copilot coding agent` — Bypass allowed for our deployment automation
- `Copilot code review` — Bypass allowed for code review

### How to Set Up Rulesets

**Path:** Public repo → Settings → Rules → Rulesets

1. **Create a new ruleset:**
   - Click "New branch ruleset"
   - Name: `Protect main`
   - Target: Branch `main`

2. **Enable (turn ON):**
   - [ ] Restrict updates
   - [ ] Restrict deletions
   - [ ] Require a pull request before merging
     - Required approvals: 1
     - Dismiss stale approvals: ON
     - Require conversation resolution: ON
   - [ ] Require status checks to pass
     - ci
     - deploy
     - Require up to date: ON
   - [ ] Block force pushes
   - [ ] Require approval of most recent push

3. **Disable (turn OFF):**
   - [ ] Restrict creations
   - [ ] Require linear history
   - [ ] Require signed commits
   - [ ] Require code scanning
   - [ ] Other advanced options (unless configured)

4. **Bypass list:**
   - Add: `Copilot coding agent` (for automation)
   - Leave most team members OFF (forces PR workflow)

### Enforcement Flow

When protection is active:

```
Developer → Edit → Commit → Push to feature branch
           ↓
GitHub → Check branch is NOT main ✓
       → Feature branch allowed ✓
           ↓
           → Create PR to main
           → Automated tests run (ci, deploy workflows)
           → If tests fail → PR blocked
           → If tests pass → PR reviewable
           → Need 1 approval
           → All comments resolved
           → Branch up to date with main
           → Ready to merge
           ↓
Reviewer → Approve PR
         ↓
GitHub → All checks pass? ✓
       → Approval count ≥ 1? ✓
       → Conversations resolved? ✓
           ↓
           → Merge allowed ✓
           → Deploy workflow runs automatically
           → New version on https://akios.ai
```

### Why We Don't Push Directly to Main

Without PRs, anyone could:
- Push broken code straight to production
- Delete the main branch
- Skip CI tests
- Have no code review
- No audit trail

**Branch protection ensures:**
- Every change is reviewed
- Every change is tested
- Production stays stable
- All changes are tracked
- Mistakes are caught before deploy

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
