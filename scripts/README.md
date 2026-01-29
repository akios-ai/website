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

### How to Set Up the Ruleset

**Path:** Public repo → Settings → **Rules** (not Branches) → Rulesets → Create New

⚠️ **Important:** The ruleset is in the **Rules** tab, not the Branches tab. The Branches tab shows branch protection rules (old system); Rules tab shows Rulesets (newer system).

#### Step 1: Basic Settings
```
Ruleset Name: Main rule
Target branches: Default (matches pattern: main)
```

#### Step 2: Bypass List

The bypass list exempts certain apps/roles from the rules. These should be:

**✅ Always Allow (already configured):**
- `Copilot coding agent` ✓ — Allows our deployment automation
- `Copilot code review` ✓ — For automated code reviews
- `Repository admin` ✓ — Admin override when needed
- `Deploy keys` ✓ — For CI/CD pipeline
- `WriteRole` ✓ — For designated writers

**❌ Team Members:** Should NOT be in bypass list (forces them to use PRs)

#### Step 3: Configure Rules

**CHECK (Enable) These Rules:**

✅ **Restrict updates**
- Only users with bypass permission can push directly
- Forces all changes through PRs

✅ **Restrict deletions**
- Prevents accidental deletion of main branch
- Protects repository history

✅ **Require a pull request before merging**
- All commits must come via PR
- **Required approvals:** Set to `1` (minimum one reviewer)
- **Dismiss stale pull request approvals:** ON ✓
  - New commits require fresh approval
- **Require review from Code Owners:** OFF (unless CODEOWNERS file exists)
- **Require approval of the most recent reviewable push:** ON ✓
  - Author cannot approve their own code
- **Require conversation resolution before merging:** ON ✓
  - All comments/discussions must be addressed

✅ **Require status checks to pass**
- **Add required checks:**
  - `ci` (build and test workflow)
  - `deploy` (deployment validation)
- **Require branches to be up to date before merging:** ON ✓
  - No merge conflicts allowed
- **Do not require status checks on creation:** OFF
  - New branches can be created freely

✅ **Block force pushes**
- Prevents `git push --force` to main
- Protects against accidental history rewrites

✅ **Allowed merge methods**
- Enable: `Squash`, `Rebase` (for clean history)
- Disable: `Merge commit` (unless team prefers)

**UNCHECK (Disable) These Rules:**

❌ **Restrict creations**
- Not needed once main exists
- Would prevent creating PR branches

❌ **Require linear history**
- Too restrictive for most teams
- Prevents merge commits

❌ **Require deployments to succeed**
- Unnecessary (deploy runs after merge)
- Would block merges incorrectly

❌ **Require signed commits**
- Only if all team members sign commits
- Most teams don't require this

❌ **Require code scanning results**
- Only if CodeQL is configured
- Add later if security scanning needed

❌ **Require code quality results**
- Only if code quality tool is configured
- Add later if needed

❌ **Automatically request Copilot code review**
- Optional; enable if using Copilot review

### Step-by-Step UI Checklist

Go to: Repository Settings → Rules → Main rule

**In "Rules" section, check these boxes:**

- [x] Restrict updates
- [x] Restrict deletions
- [ ] Require linear history
- [ ] Require deployments to succeed
- [ ] Require signed commits
- [x] Require a pull request before merging
  - Required approvals: `1`
  - [x] Dismiss stale pull request approvals
  - [ ] Require review from specific teams
  - [ ] Require review from Code Owners
  - [x] Require approval of most recent reviewable push
  - [x] Require conversation resolution before merging
- [x] Require status checks to pass
  - Add checks: `ci`, `deploy`
  - [x] Require branches to be up to date
  - [ ] Do not require status checks on creation
- [x] Block force pushes
- [ ] Require code scanning results
- [ ] Require code quality results
- [ ] Automatically request Copilot code review

### Enforcement Flow

When rules are active:

```
Developer → Edit & Commit → Push to feature branch
           ↓
GitHub → Check: Is branch == main? No ✓
       → Feature branch allowed ✓
       → Push succeeds
           ↓
           → Create Pull Request to main
           → GitHub Actions runs (ci, deploy)
           → If tests FAIL → 🔴 PR blocked
           → If tests PASS → 🟢 PR ready to review
           ↓
Reviewer → Review code → Approve PR
         ↓
GitHub → Check all conditions:
       → ✓ Status checks (ci, deploy) passed
       → ✓ At least 1 approval
       → ✓ All conversations resolved
       → ✓ Branch up to date with main
       → ✓ Most recent push approved
           ↓
           → Merge button enabled 🟢
           ↓
Developer → Click "Merge pull request"
           ↓
GitHub → Merge PR to main
       → GitHub Actions deploy workflow runs
       → 🚀 Deploy to https://akios.ai
           ↓
Production → Website updated live
```

### Why We DON'T Push Directly to Main

Without branch protection:
- Anyone could push broken code directly to production 💥
- Main branch could be deleted by accident 🗑️
- CI tests could be skipped 🛑
- No code review would happen 👁️
- No audit trail of who changed what 📋

**Branch protection ensures:**
✅ Every change is reviewed by someone else  
✅ Every change is tested automatically  
✅ Production never gets broken code  
✅ All changes are tracked (audit trail)  
✅ Mistakes caught before users see them  

### Troubleshooting Rules

**"Merge button is disabled"**
- Check: All CI checks passed (green ✓)
- Check: At least 1 approval exists
- Check: All threads are resolved
- Check: Branch is up to date (no conflicts)

**"Can't push to main directly"**
- This is expected! Use a PR instead
- Create feature branch → PR → merge

**"Deploy didn't run"**
- Check: PR was merged to main
- Check: GitHub Actions section in repo
- Check: deploy.yml workflow exists in .github/workflows/

### Bypass Rules Explained

The bypass list exists for automation and admins:

| Role | Why Bypassed | When Used |
|------|-------------|-----------|
| Copilot coding agent | For automated deployments | `scripts/deploy-to-public.sh` |
| Copilot code review | For automated code reviews | PR review comments |
| Repository admin | Emergency override | Critical hotfixes |
| Deploy keys | CI/CD pipeline access | GitHub Actions deploy |
| WriteRole | Designated maintainers | Merge without PR (rare) |

**Team members should NOT be in bypass list** — forces everyone to use PRs (good practice!)

### Using the Bypass (Copilot/Admins Only)

If you need to push directly to main (e.g., urgent hotfix, CI checks temporarily broken), the Copilot agent and repository admins can bypass rules:

```bash
cd ../website-public
git push --force origin feature-branch:main
```

**Note:** This bypasses:
- ❌ PR requirement
- ❌ Approval requirement  
- ❌ Status check requirement
- ❌ Force push protection

**Use sparingly** — Only for emergencies. The bypass is tracked in GitHub audit logs.

**Preferred approach:** Even for hotfixes, use `deploy-to-public.sh` to create a PR, then merge normally. This maintains audit trail and keeps the process consistent.


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
