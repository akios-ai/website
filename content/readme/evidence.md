---
source: README.md, section "The evidence"
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

A run's ledger is a sequence of events chained by SHA-256 over every field, with Ed25519-signed checkpoints; the signing key is created by `akios init`, one per installation. `akios report --export` writes a bundle of five files that `akios verify` checks, listing every rule that fails.

| Property | Test |
|---|---|
| Editing, inserting, deleting, reordering or truncating events after they were signed makes `akios verify` fail | V-TAMPER-01 to V-TAMPER-07 |
| A missing, removed, reordered or unsigned checkpoint makes it fail; a run without a final checkpoint fails as incomplete | V-CP-01 to V-CP-03 |
| With `--key`, a bundle re-signed with another key fails | V-KEY-01 |
| The command line and environment variable names are redacted before they are hashed and signed; a credential given as the value of an option, an assignment or a header is masked, also when the option and its value are two arguments | R-RED-01, R-RED-02 |
| `akios verify` has no platform check and gives the same result on Linux, macOS and Windows (in CI on 2026-10-12, on 2026-10-16 and on 2026-10-24: `ubuntu-latest`, `macos-latest`, `windows-latest`) | V-XOS-01 |

A valid result shows that the bundle is unchanged since it was signed with that key. It does not show which machine produced the run. Format: [ledger v0](/docs/ledger-v0.html).
