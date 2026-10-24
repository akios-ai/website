---
source: SECURITY.md
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

# Security policy

## Supported versions

| Version | Supported |
|---|---|
| 2.0 line, from 2.0.0a1 (once released) | Yes |
| 1.x | No. AKIOS 1.x is no longer maintained and is not intended for production use. |

To move from 1.x, see the [migration guide](/docs/migration-1x-to-2.html).

## Reporting a vulnerability

Do not report a vulnerability in a public issue.

Use GitHub's [private vulnerability reporting](https://github.com/akios-ai/akios/security/advisories/new) on the akios repository. If the form is unavailable, write to hello@akios.ai.

Reports are handled on a best-effort basis.

## What to include

- the AKIOS version (`akios --version`), the operating system and, on Linux, the kernel version;
- the output of `akios doctor --json` and, for a run, of `akios policy explain <policy> --json`;
- the policy and the command, and the steps to reproduce;
- what you expected AKIOS to enforce, record or reject, and what happened instead (for example: a file outside the policy was read or written, a connection was made under `network: none`, an edited bundle passed `akios verify`);
- an export bundle (`akios report --export`) when the issue concerns the evidence and the bundle holds nothing sensitive.

Remove secrets and personal data from what you send.

## Scope

The [threat model](/docs/threat-model.html) states what AKIOS protects, against which adversaries, and with which mechanism and test. Its [out-of-scope list](/docs/threat-model.html#3-out-of-scope) (for example kernel exploits, a root or same-user process outside the cage, side channels, the content of TLS traffic) and its [known limitations](/docs/threat-model.html#8-known-limitations-of-the-20-design) describe behaviour that is not a vulnerability of AKIOS. A report showing that a property the threat model states does not hold is in scope.

## Disclosure

A confirmed vulnerability is described, once fixed, in the CHANGELOG and, where warranted, in a GitHub security advisory on the akios repository, with credit to the reporter if they wish.
