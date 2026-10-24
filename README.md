# AKIOS website

The source of [akios.ai](https://akios.ai), the website of [AKIOS](https://github.com/akios-ai/akios): static HTML built with Node, hosted on GitHub Pages.

## Build

```bash
npm ci
npm run build    # writes dist/
npm run check    # internal links and anchors, no third-party resources, one e-mail address
npm run serve    # serves dist/ on http://localhost:8000
```

## Structure

```
site/              pages (HTML) and assets
site/docs/*.md     the documentation, copied from the akios repository
content/           Markdown included in pages: LEGAL.md, TRADEMARKS.md, SECURITY.md,
                   SUPPORT.md, and sections of the README of akios (content/readme/)
partials/          header and footer
internal/scripts/  build.mjs, check-links.mjs, sync-docs.mjs, serve.mjs
version.json       the AKIOS version the site describes
```

A page includes a file of `content/` with `<!-- {{include LEGAL.md shift=1}} -->`; see the top of `internal/scripts/build.mjs`.

## The documentation

`site/docs/*.md` and `content/` are copies of the documents of the akios repository, with their links rewritten for the site. Do not edit them here: change the akios repository, then copy them again from a checkout of the version to publish:

```bash
npm run sync-docs -- /path/to/akios
npm run build && npm run check
```

`content/source.json` records the git tree they were copied from.

## Deployment

A push to `main` builds the site and deploys `dist/` to GitHub Pages (`.github/workflows/deploy.yml`).

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [SECURITY.md](SECURITY.md).

## Licensing

| Component | License |
|-----------|---------|
| AKIOS ([akios-ai/akios](https://github.com/akios-ai/akios)) | GPL-3.0-only |
| Website source code (this repository) | MIT License |

**Trademark Notice:** AKIOS and the AKIOS logo are trademarks of AKIOUD AI, SAS. They are not licensed for use in derivative works. Forks must rebrand and update contact information.
