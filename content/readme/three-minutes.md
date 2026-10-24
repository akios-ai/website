---
source: README.md, section "Three minutes"
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

In the directory where your agent works:

```bash
pip install --pre akios                 # the 2.0 alpha; Python 3.10 to 3.14
akios init                              # writes akios.policy.yaml and the signing key
akios run -- python3 agent.py           # the command you already type, after --
akios report                            # what the last run did, from its verified ledger
akios report --export evidence/         # the evidence bundle of the last run
akios verify evidence/akios-run-<id>/   # exit 0 intact, 1 not intact, 2 unreadable
```

On macOS, `akios init` also grants the Python installations, Homebrew, Command Line Tools and `$TMPDIR` it finds, and `akios policy explain akios.policy.yaml --command "python3 agent.py"` tells you before you run whether the command would start.

`akios doctor` shows what this host can enforce. When the host cannot enforce the policy, `akios run` starts nothing and exits with code 3; `--allow-degraded` runs anyway and records what was not enforced.
