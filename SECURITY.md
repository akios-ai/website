# Security Policy

## Reporting a Vulnerability

We take the security of the AKIOS website seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email us directly:

**Email:** security@akios.ai

Include the following information:

- **Type of vulnerability** – XSS, CSRF, injection, etc.
- **Location** – URL, file path, or affected component
- **Steps to reproduce** – Detailed instructions
- **Potential impact** – What could an attacker accomplish?
- **Suggested fix** – If you have recommendations

### Response Timeline

- **Initial response:** Within 48 hours
- **Status update:** Within 1 week
- **Resolution:** Varies based on severity

We will acknowledge your report and work with you to understand and address the issue.

## Scope

This security policy applies to:

- ✅ The AKIOS website (https://akios.ai)
- ✅ This repository's code and dependencies
- ✅ Build and deployment processes

**Out of scope:**

- ❌ AKIOS Runtime vulnerabilities (report to the [main akios repo](https://github.com/akios-ai/akios))
- ❌ Third-party services and external links
- ❌ Social engineering attacks

## Security Best Practices

We follow these practices:

- **Dependency management** – Regular updates and vulnerability scanning
- **Content Security Policy** – Proper CSP headers on production site
- **HTTPS enforcement** – All traffic over secure connections
- **Input validation** – Sanitization of user-provided content
- **Build verification** – Automated checks before deployment

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | ✅ Yes             |
| Older   | ❌ No              |

We only support the latest deployed version of the website. Security fixes are applied to the current production version only.

## Disclosure Policy

- **Private disclosure:** Report vulnerabilities privately first
- **Coordinated release:** We will work with you on disclosure timing
- **Public acknowledgment:** We will credit you (if desired) after the fix is deployed
- **Responsible disclosure:** Please allow us reasonable time to fix issues before public disclosure

## Security Updates

Security fixes are deployed immediately upon verification:

1. Issue verified and patched
2. Automated deployment to production
3. Security advisory published (if appropriate)
4. Reporter credited (if desired)

---

**Thank you for helping keep AKIOS secure!**

Last updated: January 29, 2026
