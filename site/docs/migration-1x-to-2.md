---
source: docs/migration-1x-to-2.md
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

# Migrating from AKIOS 1.x to 2.0

AKIOS 1.x is no longer maintained and is not intended for production use. AKIOS 2.0 does not run workflows: it puts a declared policy around the program you already run, has the operating system enforce it, and writes a signed ledger of the run.

## Install

```bash
pip install --pre akios          # 2.0.0a1 is a pre-release; or: pip install akios==2.0.0a1
akios doctor                     # what this host can enforce
```

Python 3.10 to 3.14.

## Wrap an existing agent

Keep the agent as it is: its code, its model SDK, its libraries and its API keys. In the directory where it works:

```bash
akios init                                    # writes akios.policy.yaml and the signing key
akios policy explain akios.policy.yaml        # how this host enforces each clause
akios run -- python3 my_agent.py              # the command you already type, after --
akios report                                  # what the last run did, from its verified ledger
akios report --export evidence/               # the bundle of the last run
akios verify evidence/akios-run-<id>/         # check it, here or on another machine
```

The starter policy reads the system directories, writes the current directory, allows no network and sets resource limits; on Linux and macOS it also grants the Python installations and Homebrew it finds, and on macOS the Command Line Tools and `$TMPDIR`. Edit it for your agent: a model API needs `network: all`, and its key needs `environment.pass`. Policies for a coding agent, a Python script and a LangChain application are in [spec/examples](https://github.com/akios-ai/akios/tree/main/docs/spec/examples); complete programs with their policies are in the repository's `examples/` directory.

If this host cannot enforce a clause the policy needs, `akios run` starts nothing and exits with code 3. `--allow-degraded` runs anyway, and the ledger records, before the command starts, what was not enforced.

## What replaces what

| AKIOS 1.x | AKIOS 2.0 |
|---|---|
| A YAML workflow, `akios run workflow.yml`, `akios workflow validate` | Your program, run with `akios run -- <command>` under a policy; `akios policy validate` checks the policy |
| The `llm` agent and the provider clients, `akios setup`, provider keys in `.env` | Your program calls its model with its own SDK; `network: all` and `environment.pass` let it |
| The `http` and `webhook` agents, `akios http`, `allowed_domains` | Your program makes its own requests; the `network` clause is `none` or `all` |
| The `filesystem` agent | `filesystem.read` and `filesystem.write` |
| The `tool_executor` agent, `allowed_commands` | `exec`: `any`, or a list of paths that may be executed |
| The `database` agent | Your program's own driver; a database file is a `filesystem` path, a server needs `network` |
| Cost and loop kill switches, `budget_limit_per_run` | `resources`: wall time, CPU time, memory, processes, file size |
| `akios audit` and the audit log | The ledger of each run; `akios report`, `akios report --export`, `akios verify` |
| `akios protect scan` | `akios policy test <sample>` |
| `akios status`, `logs`, `timeline`, `output` | `akios report` for a run, `akios doctor` for the host |
| `akios cage`, `akios security` | A policy for each run |
| `akios templates`, `files`, `clean`, `testing`, `docs` | The programs in `examples/` and the documentation in `docs/` |
| `akios compliance`, `akios dashboard` | `akios report` describes one run from its evidence |
| `akios serve` (REST API) | None |
| `config.yaml` and the `AKIOS_*` settings | The policy file; no 2.0 command reads `config.yaml` |

## Keys and ledger

- `akios init` creates one Ed25519 signing key per installation, in `$XDG_CONFIG_HOME/akios/keys/ledger-ed25519.pem` (default `~/.config/akios/keys/`, file mode 0600, directory mode 0700). An existing key is never replaced; `akios doctor` shows its path and its `key_id`.
- A valid signature shows that a ledger is unchanged since this key signed it. It does not show which machine produced it. Give the public key, or its `key_id`, to whoever verifies your evidence, so that they can pin it with `akios verify --key`.
- Runs are kept in `$XDG_STATE_HOME/akios/runs/<run>/` (default `~/.local/state/akios/runs/`). A policy can never grant this directory or the key directory.
- `akios report --export <dir>` writes the bundle of a run: `ledger.jsonl`, `checkpoints.jsonl`, `policy.json`, `pubkey.pem` and `manifest.json`, as a directory or, with `--archive tar|tar.gz`, as one file. `akios verify` checks it on any machine; with `--key`, it also checks that it was signed by the key you expect.
- A 1.x audit log (`audit/audit_events.jsonl`) is not converted. `akios verify` recognises it and reports it as a legacy format that cannot be verified (exit 1). Keep a copy of the 1.x logs you need.

## Platforms

Enforcement substrates: Linux (Landlock ABI 3 or later for `filesystem` and `exec`; unprivileged user namespaces for `network: none`) and macOS (one Seatbelt profile per run; `memory_mb` is not enforced there). On a host that cannot enforce a clause the policy needs, `akios run` refuses unless `--allow-degraded` is given. `akios verify`, `akios report`, `akios policy`, `akios init` and `akios doctor` have no platform check (planned: CI on Linux, macOS and Windows).

The format of the evidence is in [ledger v0](/docs/ledger-v0.html), the policy language in [policy v0](/docs/policy-v0.html), and what each clause protects against in the [threat model](/docs/threat-model.html).
