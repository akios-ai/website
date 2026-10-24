---
source: SUPPORT.md
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

# Getting help with AKIOS

AKIOS is an open-source project. Help is given on a best-effort basis.

## Before asking

- [Getting started](/docs/getting-started.html) and the [README](https://github.com/akios-ai/akios/blob/main/README.md)
- [Troubleshooting](/docs/troubleshooting.html)
- [CLI reference](/docs/cli-reference.html) and [configuration](/docs/configuration.html)
- [Threat model](/docs/threat-model.html): what is protected, against whom, and what is out of scope
- [Examples](https://github.com/akios-ai/akios/blob/main/examples/README.md): programs to wrap, each with its policy

## Where to ask

| Topic | Where |
|---|---|
| Bugs, questions, feature requests | [GitHub Issues](https://github.com/akios-ai/akios/issues) |
| Security vulnerabilities | GitHub's [private vulnerability reporting](https://github.com/akios-ai/akios/security/advisories/new) on the akios repository; see [SECURITY.md](/disclosure.html). Never in a public issue |
| Anything else | hello@akios.ai |

## What helps

When you open an issue, include:

- the AKIOS version (`akios --version`) and how you installed it;
- the operating system and, on Linux, the kernel version;
- the output of `akios doctor` and, for a run, of `akios policy explain <policy>`;
- the steps to reproduce, what you expected and what happened;
- error messages, with secrets and personal data removed.

## Out of scope

Custom development, consulting, legal or regulatory advice, and support for third-party software that AKIOS wraps.
