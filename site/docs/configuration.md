---
source: docs/configuration.md
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

# Configuration (2.0 development)

In AKIOS 2.0, what one run may do is declared in a **policy** ([policy language v0](/docs/policy-v0.html)), usually `akios.policy.yaml` written by `akios init`. No command reads `config.yaml`.

The settings module of 1.x (`akios.config`: `config.yaml`, `AKIOS_<NAME>` variables and `.env` validation) is still in the package, because the general-purpose PII redactor (`akios.security.pii.PIIRedactor`) reads two of its settings when used as a library:

| Key | Type | Default | Meaning |
|---|---|---|---|
| `pii_redaction_enabled` | bool | `true` | Library use of `PIIRedactor` only. The redaction of what `akios run` records cannot be turned off |
| `redaction_strategy` | `mask`, `hash`, `remove` | `mask` | Library use of `PIIRedactor` only |

Every other 1.x key (`sandbox_enabled`, `cpu_limit`, `memory_limit_mb`, `max_open_files`, `network_access_allowed`, `audit_*`, `environment`, `log_level`, and the provider, budget and agent keys) is accepted and has no effect. Use the policy's `filesystem`, `exec`, `network`, `environment`, `resources` and `ledger` clauses instead.

## Environment variables

| Variable | Effect |
|---|---|
| `XDG_CONFIG_HOME` | Where the signing key lives: `$XDG_CONFIG_HOME/akios/keys/` (default `~/.config/akios/keys/`) |
| `XDG_STATE_HOME` | Where runs are stored: `$XDG_STATE_HOME/akios/runs/` (default `~/.local/state/akios/runs/`) |
| `AKIOS_DEBUG=1` | Debug logging (same as `--debug`) |
| `NO_COLOR=1` | No colour or styled output |

Both directories are reserved paths: no policy may grant them, their parents, or anything inside them ([policy v0 §4](/docs/policy-v0.html#4-paths)).
