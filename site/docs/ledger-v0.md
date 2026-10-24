---
source: docs/spec/ledger-v0.md
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

# AKIOS evidence format (ledger), version 0

**Status:** draft, 2026-09-29, for AKIOS 2.0. Implemented in `src/akios/ledger/`: canonical JSON, the chain, the writer with signed checkpoints, and rules R5 to R9 (golden vectors in `tests/golden/ledger/`). Key custody: `akios init` creates the key. `akios verify` applies R1 to R10. `akios report --export` writes the bundle. Version 0 may still change incompatibly until AKIOS 2.0.0 is released.

**Design decision:** one Ed25519 key per installation, created by `akios init`; the public key ships in every export. A valid signature proves integrity relative to that key. It does not prove which machine or person produced the run.

---

## 1. Purpose

A run of `akios run` produces a ledger: an append-only sequence of events, chained by hashes and covered by signed checkpoints. The export bundle lets anyone check, on any operating system, that the ledger has not been changed since it was signed, and, with the expected public key, that it was signed by that key ([threat model §7](/docs/threat-model.html#7-evidence)).

## 2. Encoding

- **Canonical JSON.** Every hashed or signed object is serialised as [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) (JSON Canonicalization Scheme) restricted as follows: numbers are integers between −(2^53−1) and 2^53−1, never fractions; object keys are ASCII; no duplicate keys; arrays and objects nest at most 64 levels deep (`[0]` is one level). Deeper input is not canonical JSON: the verifier reports it as a failure of the rule of its file (R3, R5, R7 or R10, §6), and the writer refuses to write it. For this subset, Python's `json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")` produces the canonical bytes, once the absence of floats has been checked.
- **Units** are in the field name: `_ms` (milliseconds), `_bytes`, `_micros` (millionths of a currency unit, with an ISO 4217 `currency` field). Money is never a fraction.
- **Timestamps** (`ts`) are RFC 3339 strings in UTC with microseconds, for example `2026-09-29T20:15:03.123456Z`. They are informative and hashed; ordering comes from `seq`.
- **Hashes** are SHA-256, written as 64 lower-case hex characters. **Signatures** are Ed25519 ([RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)), written in base64 with padding (RFC 4648 §4).

## 3. Events

`ledger.jsonl` holds one event per line: its canonical JSON followed by `\n`.

| Field | Type | Meaning |
|---|---|---|
| `v` | `0` | Format version |
| `run` | 32 hex characters | Run identifier, 128 random bits, identical in every event and checkpoint |
| `seq` | integer | 0 for the first event, then +1 per event |
| `ts` | string | Time the wrapper wrote the event |
| `type` | string | One of the types below |
| `data` | object | Type-specific content |
| `hash` | hex | Chain hash, defined below |

**Chain.** Let `E_n` be event `n` without its `hash` field, and `H_(−1)` 32 zero bytes. Then

```
H_n = SHA-256( H_(n−1) ‖ canonical(E_n) )
```

where `‖` is byte concatenation and `H_n` is the raw 32-byte digest. The `hash` field of event `n` is `H_n` in hex. Every field of the event, including `seq` and `ts`, is covered.

**Types.** The minimum content of `data` is listed; a writer may add fields, which are covered by the hash like the rest.

| Type | When | `data` (minimum) |
|---|---|---|
| `run_start` | first event | `akios_version`; `policy_sha256` (§5); `argv` (list, after redaction) or `null` if `ledger.argv: none`; `argv_redactions`; `env_names` or `null`; `cwd`; `host` (`os`, `kernel`, `arch`, `landlock_abi` or `null`). On macOS the reference writer adds to `host` `macos_version` (the product version, for example `26.6.2`, or `null` if unknown) and `seatbelt` (`true` when the Seatbelt self-test passed on this host). The reference writer adds `akios_source_tree` (the git tree of the release commit a wheel built by the release procedure was made from, the tree `git rev-parse vX.Y.Z^{tree}` prints in the public repository; `null` for any other installation), `policy_name` (redacted), `policy_file_sha256` (the SHA-256 of the policy file's bytes, as `source.sha256` in `policy.json`) and `redactions` (count per recorded field: `argv`, `env_names`, `cwd`, `policy_name`) |
| `preflight` | before the decision | `clauses`: for each clause, `clause`, `required`, `enforceable`, `mechanism`, and `reason` when not enforceable |
| `decision` | before the child starts, or instead of starting it | `action`: `start`, `start_degraded` or `refuse`; `degraded`: list of clauses not enforced (empty for `refuse`: nothing ran); the reference writer adds `missing`, each clause that cannot be enforced with its reason, and `command` when the command check refused the run ([policy §6.1](/docs/policy-v0.html#61-the-command-check)): `right` (`read` or `execute`), `clause`, `path` (the file) and `add` (the path to add), both redacted like the command line, or `null` with `ledger.argv: none`; `command` is the first file found, and `command_issues` lists every file found, the first included, in the same form; on macOS, `developer_tools` when the command check met a shim of `/usr/bin` ([policy §5.7](/docs/policy-v0.html#57-macos-seatbelt)): for each, `program` (the shim) and `tool` (the developer tool `xcrun --find` named before the run), redacted like the command line, or `null` with `ledger.argv: none` |
| `enforcement` | after the child reported the result of applying the policy | `applied`: clause, mechanism, detail (for example the Landlock ABI), including what the wrapper applies itself (the environment); `failed`: the clause and error, or `null`. `stage: prepare` when the failure happened in the wrapper before the fork |
| `budget_exceeded` | a resource limit ended the run | `limit`, `value`, `measured` or `null`; the reference writer adds `measured_unit`, and `enforced_by` when the limit was not reached by the wrapper's watchdog: `kernel` (the kernel's signal) or `cpu_sampler` (macOS, with `sampling_interval_ms`) |
| `output_digest` | at exit, with `ledger.output_digests` | `stdout_sha256`, `stdout_bytes`, `stderr_sha256`, `stderr_bytes`; the reference writer adds `stdout_complete` and `stderr_complete`: `false` when the stream had not ended 5 seconds after the command ended (a process outside the run's process group kept it open), in which case the digest is `null`, the count is what was read, and the run ends all the same |
| `process_sweep` | macOS: at the end of the run, once the child has exited | `found`: the run's processes still running, found by its Seatbelt profile; `terminated`: how many of them the sweep ended (both zero most of the time) |
| `denials` | macOS, with `ledger.denials` ([policy §5.6](/docs/policy-v0.html#56-ledger)): after `process_sweep`, once the run's processes are gone; also before `run_exit` when the command could not be executed | `source` (`macos_system_log`); `captured`: whether the reader received anything for this run; `complete`: `false` when the reader was not attached for the whole run, stopped early, or denials were left out of `entries`, with `reason`; `total`: the denials counted, repeats included; `distinct`: the distinct (operation, target) pairs counted; `entries`, each with `operation` (the Seatbelt operation, for example `file-write-create`), `target` (the path, service or address the report names, or `null`), `count`, `programs` (up to four program names), `protected` (`true` for a write refused on a path the profile keeps read-only inside the write paths: a path of `filesystem.protect` or beneath it, the policy file, or a folder that holds them) and `targets` (the distinct targets the entry stands for: 1, or more for paths grouped by the folder that holds them, which `target` then names); `dropped`: per operation (`read`, `write`, `exec`, `network`, `service`, or the Seatbelt operation), the denials counted but in no entry; `limit` (25); `redactions`; `reader_ready_ms`: how long the reader took to be confirmed before the command started, or `null`. The reference writer records first every `protected` pair, then every refused write, link, removal, rename and execution (at most 100 entries, grouped by folder beyond), then the `limit` most frequent of the others (services, network, reads), most frequent first: reads that do not fit are grouped by folder, at the deepest level at which they fit, and what still does not fit is in `dropped`; every denial counted is in an entry or in `dropped`. It counts at most 4096 distinct pairs of each kind (writes and executions, others); denials of the others are in `total` and `dropped` only. A connection refused without an address (`network-outbound`, `target` `null`) is one to a kernel control socket (`AF_SYSTEM`), not IP traffic |
| `wrapper_error` | an internal error of the wrapper | `message`. When the error happens while the command runs, the wrapper first kills the run's processes (the child's process group, and on macOS the run's other processes) and reaps the child; the `run_exit` that follows gives the child's status |
| `run_exit` | last event, also for a refused run | `exit_code` or `null`, `signal` or `null`, `wall_ms`, `cpu_user_ms`, `cpu_system_ms`, `max_rss_bytes`; the reference writer adds `refused: true` for a refused run (including one whose enforcement failed in the child), `exec_error` when the command could not be executed, and `interrupted: true` when the wrapper received SIGINT while the command ran (it forwards it to the command) |

The wrapper writes each decision before acting on it: `decision` before the fork, `budget_exceeded` before the kill. An `enforcement` entry says `applied` only after the kernel call that applies it returned success.

**What is redacted.** The strings the wrapper records about the run are redacted (PII and secrets) before they are hashed, so the signature covers the redacted form: the command line and the paths of the command check (with `ledger.argv: redacted`; with `none` neither is recorded), the environment variable names, the working directory, the policy's name, error messages (`wrapper_error`, `exec_error`, the `error` of a failed enforcement), and the targets and program names of `denials` (pairs that redact alike are merged; `redactions` counts the values masked). In a target of `denials`, a UUID (8-4-4-4-12 hexadecimal digits) is also replaced by `[UUID]`: macOS names per-machine files with the hardware UUID of the Mac (`~/Library/Preferences/ByHost/.GlobalPreferences.<UUID>.plist`). The effective policy (`policy.json`, §5) is exported exactly as it was enforced, because its SHA-256 in `run_start` stands for what was enforced: its name, description, declared and resolved paths, source path and the names of the variables it passes are not redacted, and `akios report` shows them. Its resolved paths, like the working directory in `run_start` and the targets of `denials`, can contain the user's name (`/Users/<name>/…`, `/home/<name>/…`), and on macOS `$TMPDIR` resolves to the per-user temporary folder, whose name (`/private/var/folders/<xx>/<id>/T`) is the same for every run of that user on that Mac. The host facts, the clause matrix and the enforcement details, which AKIOS writes from the host and the policy, are not redacted either. Personal data and secrets do not belong in a policy file or in the paths it grants.

**Redaction is heuristic.** Values are found by pattern (the PII and secret formats AKIOS knows) and by context: the value of an option whose name marks a credential (`--api-key`, `--token`, `--password`, `--secret`, other names that end the same way, and `-p`), whether it is the next argument, follows `=` or is attached to `-p`, and also when another option comes before it (`--verbose --token VALUE`); the value of a `NAME=value` assignment whose name marks a credential; and the value of an `Authorization` header (its scheme is kept) or of a header whose name marks a credential. Such a value is recorded as `[CREDENTIAL]`, also inside one argument such as the script of `sh -c`, and the value after `-p` is masked whatever the program means by it, except a port or a port mapping (`2222`, `8080:80`), which is kept (R-RED-01, R-RED-02). A secret in a format AKIOS does not know, in a position these rules do not recognise (a positional argument, an option with another name), is recorded as it is; with `ledger.argv: none` the command line is not recorded.

**Mechanisms on macOS.** With the Seatbelt substrate ([policy v0 §5.7](/docs/policy-v0.html#57-macos-seatbelt)), the `applied` entries of `enforcement` name these mechanisms:

| Mechanism | Clauses | Detail |
|---|---|---|
| `seatbelt` | `baseline`, `filesystem`, `filesystem.protect`, `exec` (with a list), `network` (`none`) | One profile for these clauses, applied in the child before `execve`. Each detail names the profile by `Seatbelt profile sha256 <hex>` or `profile sha256 <hex>`: the first 16 hex characters of the SHA-256 of the profile text, a zero byte, and its parameters (the resolved paths and the run's marker) as JSON with sorted keys. The `baseline` detail also gives the number of read, write and exec rules, the platform base version, the network mode, the number of write directories that accept Unix-domain sockets, whether the run's terminal rule was added, whether the policy file is read-only, the number of protected paths, the number of reserved paths denied, and that the profile's denials are reported with the run's marker. The `filesystem.protect` detail gives the number of protected paths and of the folders that hold them kept in place |
| `wrapper` | `baseline` | The number of environment variables whose values the wrapper overwrote in its own memory before the fork |
| `process_sweep` | `baseline` | The run's processes, found by the profile, are signalled after a wall-clock kill and when the wrapper is interrupted, and killed at the end of the run |
| `rlimit_cpu`, `cpu_sampler` | `resources.cpu_seconds` | `RLIMIT_CPU` (soft limit the value, hard limit one second more), and the wrapper's reading of the run's CPU times: its interval, and the hard limit at which it ends the run |

On Linux, `filesystem.protect` is applied by the mechanism `mountns`: read-only bind mounts in the run's own mount namespace; its detail says whether a user namespace was made for it (with `network: all`) or the one of the network namespace was used, and the number of read-only mounts and of folders kept in place.

When the CPU sampler ends a run, `budget_exceeded` has `enforced_by: cpu_sampler`, `measured` the CPU time of the process that reached the hard limit (in `ms`), and `sampling_interval_ms`. When `network: domains` runs degraded on macOS, the profile allows any IP traffic and the `baseline` detail says so. The profile text is not part of the export bundle.

## 4. Checkpoints and keys

`checkpoints.jsonl` holds one signed checkpoint per line, canonical JSON followed by `\n`:

| Field | Meaning |
|---|---|
| `v`, `run` | As in events |
| `cp` | Checkpoint number: 0, then +1 |
| `seq` | `seq` of the last event covered |
| `head` | `H_seq` in hex |
| `ts` | Time of signing |
| `final` | `true` only for the last checkpoint of the run |
| `key_id` | SHA-256 of the 32-byte raw public key, hex |
| `sig` | Ed25519 signature over `"AKIOS-LEDGER-V0-CHECKPOINT\0"` followed by the canonical JSON of the checkpoint without `sig` |

- The wrapper writes a checkpoint after the `decision` event, after every 64 events, and a final one after `run_exit`. No event follows the final checkpoint.
- Before writing a checkpoint, the wrapper flushes and `fsync`s the events it covers; then it writes and `fsync`s the checkpoint.
- **Key.** Ed25519, one per installation, created by `akios init`. The private key is stored as PKCS#8 PEM in `$XDG_CONFIG_HOME/akios/keys/ledger-ed25519.pem` (default `~/.config/akios/keys/`), file mode 0600, directory mode 0700. `akios run` refuses to start without it. The key directory is a reserved path that no policy may grant ([policy §4](/docs/policy-v0.html#4-paths)).

## 5. Storage and export bundle

During the run, the files live in `$XDG_STATE_HOME/akios/runs/<run>/` (default `~/.local/state/akios/runs/<run>/`, mode 0700), a reserved path.

The export is a directory named `akios-run-<run>`, or a tar archive of it (`.tar` or `.tar.gz`), containing exactly:

| File | Content |
|---|---|
| `ledger.jsonl` | the events (§3) |
| `checkpoints.jsonl` | the checkpoints (§4) |
| `policy.json` | the effective policy ([policy §8](/docs/policy-v0.html#8-effective-policy)) as canonical JSON bytes, without a trailing newline; its SHA-256 is `policy_sha256` in `run_start` |
| `pubkey.pem` | the Ed25519 public key, SubjectPublicKeyInfo PEM |
| `manifest.json` | canonical JSON: `v`, `run`, `akios_version`, `created`, and `files`, mapping each of the four files above to its SHA-256 |

## 6. Verification

`akios verify <bundle> [--key <pubkey.pem or key_id>] [--strict] [--json]` runs on Linux, macOS and Windows with no platform check. Exit codes: **0** valid, **1** invalid, **2** the bundle cannot be read at all (path absent, not a directory or tar archive, unsafe archive member, unknown `v`).

The verifier applies every rule; the first failure decides exit 1, and the report lists all failures found.

| Rule | Check |
|---|---|
| R1 | Archive members are regular files inside the bundle directory: no absolute path, no `..`, no link (else exit 2) |
| R2 | The bundle contains exactly the five files. A missing or extra file fails; a missing `checkpoints.jsonl` is a failure, never a "self-consistent" ledger |
| R3 | Each file's SHA-256 equals the manifest's |
| R4 | `pubkey.pem` is an Ed25519 key; its `key_id` is computed. With `--key`, it must equal the pinned key |
| R5 | Every event line is canonical JSON, with `v = 0`, the same `run`, `seq` equal to its line index (0, 1, 2, …), and a `type` of §3 (a verifier older than a type, such as `denials`, rejects a bundle that has it) |
| R6 | Each `hash` equals the recomputed `H_n` |
| R7 | There is at least one checkpoint; `cp` equals its line index; `seq` strictly increases; each `head` equals the recomputed `H_seq`; each `key_id` equals the bundle key's; each signature is valid |
| R8 | Exactly one checkpoint is final, it is the last line, and its `seq` is the last event's |
| R9 | The first event is `run_start`, the last is `run_exit`, and a `decision` event precedes any `enforcement` event |
| R10 | `policy.json` is a canonical JSON object and its SHA-256 equals `run_start.data.policy_sha256` |

A valid result states the run identifier, the `key_id` and whether it was pinned, and the clauses recorded as degraded. When the `filesystem` clause was degraded, the report says that the evidence is untrusted, because the child could reach the signing key ([threat model §6](/docs/threat-model.html#6-fail-closed-rules)). With `--strict`, any degraded clause makes the result invalid.

A valid result means: the bundle is unchanged since it was signed with this key. It does not show which machine produced it, that its clock was right, that the wrapper was intact, or anything the ledger does not record.

## 7. Tamper scenarios

Seven ways to tamper with a ledger, and the rules that detect each of them in v0:

| # | Tampering | Detected by |
|---|---|---|
| 1 | Edit an event, keep its old hash | R6: the recomputed hash differs |
| 2 | Edit an event and recompute its hash, and every following hash | R7: the signed `head` no longer matches; a new signature needs the private key. R3 also fails unless the manifest is rewritten |
| 3 | Edit a timestamp | R6 (`ts` is hashed), or R7 if the hashes are recomputed |
| 4 | Delete an event in the middle | R5 (`seq` gap), R6, R7 |
| 5 | Truncate the last events | R8: the final checkpoint's `seq` is beyond the last event. If the final checkpoint is removed too, R8 (no final checkpoint) |
| 6 | Swap two events | R5 (`seq` out of order), R6 |
| 7 | Delete the checkpoint file | R2 and R7: a missing checkpoint is a failure |

One further case: replacing `pubkey.pem` and re-signing everything with another key is detected only when the verifier pins the expected key (R4). Without a pin, the report shows the `key_id` so that the reader can compare it.

The formal model ([`docs/tla/AKIOSRun.tla`](https://github.com/akios-ai/akios/blob/main/docs/tla/README.md)) states the same result abstractly, as the invariant `VerifyRejectsAnyAdversaryAction`.

## 8. Ledgers from AKIOS 1.x

The 1.x audit log (`audit/audit_events.jsonl` with `audit/merkle_root.hash`) is not v0 evidence. `akios verify` recognises it and exits 1 with the reason "legacy format, not verifiable".
