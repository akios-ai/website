---
source: README.md, section "The policy flow"
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

1. `akios init` writes a starter policy: read the system directories, write the current directory, no network, resource limits; on Linux and macOS, also the installed Pythons it finds, listed in the policy.
2. Edit it for your agent. A model API needs `network: all`, and its key needs `environment.pass`.
3. `akios policy validate` checks it. `akios policy explain` prints, for this host, the mechanism for each clause and whether `akios run` would start, start degraded or refuse; with `--command "<command>"`, whether it would start that command, or which path to add.
4. `akios run --policy <file> -- <command>` enforces it, records the decision before the command starts, and signs the ledger.
5. `akios report` and `akios verify` read the evidence; `akios verify --key` pins the public key you expect.

A policy for a coding agent:

```yaml
version: 0
name: coding agent in one project
filesystem:
  read: [/usr, /lib, /etc, /proc, ~/.gitconfig]
  write: [., /tmp, /dev/null, /dev/tty, ~/.cache]
exec: any
network: all
environment:
  pass: [AGENT_API_KEY]
resources: {wall_seconds: 14400, cpu_seconds: 7200, memory_mb: 8192, max_processes: 512}
on_unenforceable: refuse
```

The language: [policy v0](/docs/policy-v0.html). Policies for a coding agent (also [on macOS](https://github.com/akios-ai/akios/blob/main/docs/spec/examples/coding-agent-macos.policy.yaml), and [Codex on macOS](https://github.com/akios-ai/akios/blob/main/docs/spec/examples/codex-macos.policy.yaml)), a Python script and a LangChain application: [docs/spec/examples](https://github.com/akios-ai/akios/tree/main/docs/spec/examples). Programs to wrap, each with its policy: [examples](https://github.com/akios-ai/akios/blob/main/examples/README.md).
