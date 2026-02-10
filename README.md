# AKIOS Website

Public website for **[AKIOS](https://akios.ai)** – an advanced agentic runtime with built-in policy enforcement, secure communication, and production-ready workflows.

**Live Site:** [https://akios.ai](https://akios.ai)

## Features

- 🚀 **Automated Deployment** – one-command push to production
- 🔄 **Auto-Versioning** – version numbers injected across all docs at build time
- 🌍 **Multilingual** – i18n support (English, French)
- ⚡ **Fast Build** – optimized static site generation
- 📱 **Responsive** – mobile-first design
- 🎨 **MDX Support** – React components in Markdown

## Quick Start

```bash
# Install dependencies
npm install

# Start local dev server
npm run serve

# Build for production
npm run build
```

Visit [http://localhost:8000](http://localhost:8000)

## Project Structure

```
site/
├── index.html          # Marketing home page
├── docs/               # Documentation (MDX)
├── blog/               # Blog posts (MDX)
├── community.html      # Community page
├── legal.html          # Legal page
└── assets/             # CSS, images, diagrams

partials/
├── header.html         # Global navigation
└── footer.html         # Global footer

internal/
├── scripts/            # Build & deployment automation
└── i18n/               # Translation modules
```

## Development Workflow

### Local Development

```bash
npm run serve    # Start dev server (port 8000)
npm run build    # Build static site to dist/
```

### Content Editing

- **Documentation:** Edit `site/docs/*.mdx`
- **Blog Posts:** Edit `site/blog/*.mdx`
- **Marketing Pages:** Edit `site/*.html`
- **Styles:** Edit `site/assets/css/styles.css`

### Version Management

Version numbers are managed via `version.json`:

```json
{
  "version": "1.0.5"
}
```

All docs automatically reference `{{version}}` – no manual updates needed.

## Deployment

**Automated deployment to production:**

```bash
bash scripts/deploy-direct.sh "Your commit message"
```

This single command:
- ✅ Syncs content to public repo
- ✅ Builds the site
- ✅ Validates changes
- ✅ Commits and pushes to main

No branch management. No manual steps. No cleanup required.

## Technology Stack

- **Build System:** Node.js (ESM modules)
- **Content:** MDX (Markdown + JSX)
- **Styling:** Custom CSS
- **i18n:** JSON translation modules
- **Deployment:** Automated shell scripts
- **Hosting:** GitHub Pages

## Contributing

We welcome contributions! 

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a Pull Request

**Please read:**
- [Contributing Guidelines](CONTRIBUTING.md) – How to contribute
- [Code of Conduct](CODE_OF_CONDUCT.md) – Community standards
- [Security Policy](SECURITY.md) – Reporting vulnerabilities

**Content Guidelines:**
- Documentation should be clear and concise
- Include code examples where relevant
- Test locally before submitting
- Follow existing style and structure

## Licensing

| Component | License |
|-----------|---------|
| **AKIOS Open Runtime** (separate repo) | GPL-3.0-only |
| **Website Source Code** (this repo) | MIT License |
| **AKIOS PRO** | Proprietary |

**Trademark Notice:** AKIOS and the AKIOS logo are trademarks of AKIOUD AI, SAS. They are not licensed for use in derivative works. Forks must rebrand and update contact information.

## Links

- **Main Site:** [https://akios.ai](https://akios.ai)
- **Documentation:** [https://akios.ai/docs](https://akios.ai/docs)
- **GitHub Organization:** [https://github.com/akios-ai](https://github.com/akios-ai)

---

Built with automation. Deployed with confidence. 🚀
