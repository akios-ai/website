## Description

Briefly describe the changes made in this pull request.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (existing behavior changes)
- [ ] Documentation/content update
- [ ] Maintenance/refactor

## Tests

- [ ] Tests added or updated
- [ ] No tests needed (explain why)

**Test Notes:**  
Explain how you verified the changes (manual steps, commands, or tests).

## AKIOS v3 Web Guardrails

- [ ] Layout and tokens
  - [ ] `.page` is used for main layout on landing, docs, blog, and community.
  - [ ] No new magic numbers in CSS where a token would work.
  - [ ] New spacing or radius values use existing tokens or a clearly reused utility.

- [ ] Motif and typography
  - [ ] Cyan rail / accent motif is applied consistently (hero + section headings + at least one component).
  - [ ] Headings use the shared H1–H4 scale; no page-specific font-size one-offs.
  - [ ] New cards or components align with existing docs/feature card patterns.

- [ ] Accessibility and interaction
  - [ ] Focus-visible is obvious for any new links or buttons.
  - [ ] No hover-only critical actions; keyboard usage remains possible.
  - [ ] Copy button and theme toggle stay accessible (ARIA + focus behavior not regressed).

- [ ] HTML and CSS simplicity
  - [ ] No new frameworks, theme CSS, or layout engines introduced.
  - [ ] `styles.css` remains the single source of visual truth (plus optional minimal reset).
  - [ ] No inline `style=` attributes added to HTML.

- [ ] Docs and content clarity
  - [ ] Quickstart path stays obvious: landing → `docs/quickstart` → working sandbox.
  - [ ] Security docs keep “Out of Scope” and “How to Verify” sections accurate if touched.
  - [ ] New docs follow the same docs layout and typography system.

## Lighthouse (Manual Check)

Run Lighthouse in Chrome DevTools against:

- `http://localhost:8000/` (landing)
- `http://localhost:8000/docs/` (docs index)

Targets:

- [ ] ≥ 95 Performance on both pages
- [ ] ≥ 95 Accessibility on both pages

If scores fall below targets:

- [ ] Regression understood and fixed, or
- [ ] Tradeoff explained in this PR description

