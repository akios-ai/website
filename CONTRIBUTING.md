# Contributing to AKIOS Website

Thank you for your interest in contributing to the AKIOS website! This document provides guidelines for contributing.

## How to Contribute

### Reporting Issues

Found a bug or have a suggestion?

1. Check existing [issues](https://github.com/akios-ai/website/issues) to avoid duplicates
2. Create a new issue with a clear description
3. Include reproduction steps for bugs
4. Add screenshots if relevant

### Submitting Changes

1. **Fork the repository**
   ```bash
   git clone https://github.com/akios-ai/website.git
   cd website
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Edit content in `site/` directory
   - Test locally with `npm run serve`
   - Build to verify: `npm run build`

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Contribution Guidelines

### Content

- **Documentation:** Clear, concise, and accurate
- **Code examples:** Tested and working
- **Blog posts:** Technical, informative, and well-structured
- **Translations:** Accurate and culturally appropriate

### Style

- Use Markdown formatting consistently
- Follow existing patterns in the codebase
- Keep line length reasonable (80-120 characters)
- Use proper grammar and spelling

### Technical

- Test all changes locally before submitting
- Ensure builds complete without errors
- Don't commit `node_modules/` or `dist/`
- Update version references using `{{version}}` placeholder

## Types of Contributions

We welcome contributions in these areas:

- 📝 **Documentation improvements** – Clarifications, examples, corrections
- 🌍 **Translations** – New languages or improving existing translations
- 🐛 **Bug fixes** – Typos, broken links, rendering issues
- ✨ **Features** – New pages, components, or functionality
- 🎨 **Design** – UI/UX improvements and responsive design

## Code Review Process

1. All submissions require review before merging
2. Maintainers will provide feedback within 1-2 weeks
3. Address review comments and update your PR
4. Once approved, a maintainer will merge your contribution

## Development Setup

```bash
# Install dependencies
npm install

# Start local dev server (port 8000)
npm run serve

# Build for production
npm run build
```

## Questions?

- **Documentation:** Check the [README](README.md)
- **Discussions:** Open a GitHub Discussion
- **Contact:** contact@akios.ai

## License

By contributing, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers this project.

---

Thank you for making AKIOS better! 🚀
