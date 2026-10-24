---
source: docs/cli-reference.md
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

# CLI reference (2.0 development)

AKIOS 2.0 has six commands. The 1.x commands (`audit`, `setup`, `templates`, `workflow`, `status`, `logs`, `cage`, `protect`, `http`, `serve`, `compliance` and others) were removed; see the [migration guide](/docs/migration-1x-to-2.html) for what replaces each of them.

```
akios init [DIR] [--example codex] [--force] [--json] [--quiet]
akios policy validate <policy> [--json]
akios policy explain <policy> [--command CMD] [--json]
akios policy test <sample> [--json]
akios run [--policy <file>] [--allow-degraded] [--quiet] -- <command> [args...]
akios verify <bundle> [--key <pubkey.pem or key_id>] [--strict] [--json]
akios report [RUN] --export <dir> [--archive tar|tar.gz] [--json]
akios report [BUNDLE | RUN] [--format md|html] [--output <file>] [--key <pubkey.pem or key_id>]
akios doctor [--policy <file>] [--json] [--verbose]
akios --version | --help | --debug
```

`akios --version` prints the version of the code that runs. A wheel built by the release procedure also names the git tree of its release commit, `AKIOS X.Y.Z (source tree <its first 12 hexadecimal digits>)`: in the public repository, `git rev-parse vX.Y.Z^{tree}` prints the same tree, and the ledger's `run_start` records it in full (`akios_source_tree`, [evidence format §3](/docs/ledger-v0.html#3-events)). Any other installation (a checkout, an editable install, a wheel built from the sdist) prints the version only.

No command has a platform check: `run` decides for each clause whether this host can enforce it (exit 3 when it cannot, unless degraded), and `verify`, `report`, `policy`, `init` and `doctor` work on every OS ([threat model §8](/docs/threat-model.html#8-known-limitations-of-the-20-design)). No command reads `config.yaml`.

## `akios init`

Prepares a directory (the current one, or `DIR`, created if needed) for `akios run`:

- `akios.policy.yaml`: a starter policy for a program that works in this directory (read the system directories, write here and `/dev/null`, execute anything readable, no network, resource limits, the command line recorded after redaction). It also grants, for reading, this directory and what it finds on the host: the installation of each Python interpreter on `PATH` (`python3`, `python3.N`; symbolic links followed, so that a pyenv root, a uv-managed Python or an installation under `/opt` is granted where it lives, and for a virtual environment the installation it was created from, also for `./.venv`), and Homebrew. On Linux it also grants the installation of the Python that runs AKIOS and the tool cache of a GitHub Actions runner (`$RUNNER_TOOL_CACHE`, `/opt/hostedtoolcache`), and shows `memory_mb` commented out. On macOS it also grants the developer tools that `/usr/bin/python3`, `git` and `make` load, and the Command Line Tools when present besides Xcode (they also look for their SDKs there), grants `$TMPDIR` for writing and has no `memory_mb`. The paths it found are listed in the policy, each with why it is there; one that is, contains or is inside a reserved path, or on macOS contains a folder macOS guards with privacy prompts, is left out and the policy says so. The policy is validated before it is written: a directory that contains the ledger store or the signing key, such as the home directory, is refused. Edit it, then check it with `akios policy explain akios.policy.yaml`;
- the installation's ledger signing key, if there is none yet: an Ed25519 key in `$XDG_CONFIG_HOME/akios/keys/ledger-ed25519.pem` (default `~/.config/akios/keys/`), file mode 0600, directory mode 0700 ([ledger v0 §4](/docs/ledger-v0.html#4-checkpoints-and-keys)). An existing key is never replaced. The output shows the key path and its `key_id`.

With `--example codex`, it writes the [Codex example](https://github.com/akios-ai/akios/blob/main/docs/spec/examples/codex-macos.policy.yaml), `codex-macos.policy.yaml` (Codex in one project, on macOS), instead of the starter, validated the same way, and prints the two commands to try first ([getting started](/docs/getting-started.html#wrap-codex-on-macos)); the package holds the example, so an installed AKIOS writes it without the repository.

It refuses to overwrite an existing policy file unless `--force` is given. Exit 0, or 1 with the reason (2 for an unknown example).

## `akios run`

```
akios run [--policy <file>] [--allow-degraded] [--quiet] -- <command> [args...]
```

Runs a program you already have inside a policy ([policy language v0](/docs/policy-v0.html)) and writes a signed ledger of the run ([evidence format v0](/docs/ledger-v0.html)) in `$XDG_STATE_HOME/akios/runs/<run>/`. The policy defaults to `./akios.policy.yaml`. The signing key must exist (`akios init`).

1. The wrapper records `run_start` (command line, environment variable names and working directory, redacted; the SHA-256 of the policy file and of the effective policy), the clause matrix (`akios policy explain` shows the same) and its decision, and signs a checkpoint. When the policy file differs from the one the previous run with that file used (same path, in the same ledger store), it first prints one line: `akios: note: the policy file <path> changed since run <id>, the previous run with it (sha256 <before> then, <now> now)`.
2. If a clause the policy needs cannot be enforced on this host, nothing starts and the exit code is **3**, unless `--allow-degraded` is given or the policy says `on_unenforceable: degrade`: the run then starts, and the ledger has already recorded which clauses were not enforced.
   When the filesystem clause is enforced, the command check runs too ([policy v0 §6.1](/docs/policy-v0.html#61-the-command-check)): if the program, its `#!` interpreter or what Python reads at start is not under a granted path, nothing starts, the exit code is **3**, and the message names every such file the check finds, each with the path to add and the clause (two lines when there is one); the ledger's `decision` records them.
3. The child receives only the environment the policy allows, runs in its own process group, and gets the terminal when AKIOS had it. SIGINT, SIGTERM, SIGHUP and SIGQUIT sent to AKIOS are forwarded to that group; a run stopped by SIGINT to AKIOS is recorded with `interrupted: true` in `run_exit`, and `akios run` and the report say "stopped by the user". When the child exits, what is left of its process group is killed; on macOS, so are the run's processes that left the group.
4. On macOS, `process_sweep` records how many of the run's processes were still running once the command exited, and how many the sweep ended, and, with `ledger.denials` (the default), `denials` records what the cage refused during the run, read from the sandbox reports of the system log from before the command started until its processes were gone ([policy v0 §5.6](/docs/policy-v0.html#56-ledger)). `run_exit` records the exit code or signal, wall time, CPU time and peak memory; a final checkpoint closes the ledger. `akios report <run> --export <dir>` writes the bundle; `akios verify` checks it. When denials were recorded, `akios run` adds one line, whatever the exit code: `akios: the cage refused N operations (write ~/.codex/config.toml (kept read-only by the policy), read …, and M more); akios report <run> lists them`, with the [troubleshooting page](/docs/troubleshooting.html#denials). It names first a write refused on a path the policy keeps read-only, then writes, executions, connections and reads (several of one folder together, with how many paths and up to three of their names; writes to a cache folder after the reads), and last what a shell reads at start (`~/.zshenv`, `/dev/tty`) and kernel control sockets; `akios report` lists them in the same order. When none could be recorded (on Linux, or when the record is incomplete) and the command ends with a non-zero exit code under an enforced filesystem clause, the line says instead how the system reports a denied operation ("Operation not permitted" on macOS; "Permission denied" or "Operation not permitted" on Linux); it does not say that a denial was the cause.

What this version enforces is only what `akios policy explain` lists as enforced on this host; the rest is recorded as not enforced. On Linux the kernel clauses use Landlock, seccomp and a network namespace; on macOS, one Seatbelt profile per run, and `memory_mb` is not enforced there ([policy v0 §5.7](/docs/policy-v0.html#57-macos-seatbelt)). On other systems no kernel clause can be enforced ([threat model §8](/docs/threat-model.html#8-known-limitations-of-the-20-design)), so every run there is refused or degraded, and the evidence of a run without the filesystem clause is marked untrusted.

`akios run <workflow.yml>` (the 1.x form, without `--`) prints that YAML workflows are not supported in 2.0 and points to the [migration guide](/docs/migration-1x-to-2.html), and exits with code 2.

Exit codes of `akios run`: the command's own exit code; **128 + N** when the command was killed by signal N; **124** when a resource limit ended the run; **3** refused (a clause cannot be enforced, the command check found a file the command needs outside the granted paths, or applying the policy failed in the child: the command did not run); **2** usage or configuration error (no policy, invalid policy, no signing key; nothing is recorded); **126** or **127** the command could not be executed or was not found; **70** internal error of the wrapper (recorded as `wrapper_error`). The ledger tells these cases apart when the command's own code is 2 or 3.

## `akios verify`

```
akios verify <bundle> [--key <pubkey.pem or key_id>] [--strict] [--json]
```

Checks an exported run: a directory `akios-run-<run>` or a `.tar` / `.tar.gz` of it ([ledger v0 §5 and §6](/docs/ledger-v0.html#6-verification)). Pure Python, no platform check: it gives the same result on Linux, macOS and Windows. It applies every rule (R1 to R10) and lists every failure:

- archive members must be regular files inside the bundle directory (no absolute path, `..` or link);
- exactly five files, each matching the SHA-256 in `manifest.json`; a missing `checkpoints.jsonl` is a failure, never a "self-consistent" ledger;
- every event is canonical JSON with `seq` 0, 1, 2, …, and its hash chains to the previous one;
- every checkpoint is signed by the bundle's Ed25519 key over the recomputed head; exactly one is final, it is the last, and it covers the last event;
- the first event is `run_start`, the last `run_exit`; `policy.json` matches the digest in `run_start`.

`--key` pins the expected public key: its `key_id` (64 hex characters; `akios doctor` shows the `key_id` of this installation's signing key) or its public key file (the `pubkey.pem` of an export of a run signed with that key, also kept in the run's folder of the ledger store). The private key file is never needed to verify; given one, or a file that is not an Ed25519 public key, `akios verify` prints one line that says what `--key` takes and exits with code 2 (with `--json`, the same line is the result's failure). Without it, a valid result means "unchanged since it was signed by the key shipped in this bundle"; the output shows the `key_id` so that it can be compared. A bundle re-signed with another key is detected only with a pin: the result is invalid (R4), and the `key_id` line names the bundle's key "not the pinned key" with the one given (`key_pinned: false` and `pinned_key` with `--json`). `--strict` makes any degraded (not enforced) clause a failure. When the `filesystem` clause was not enforced, the result says the evidence is untrusted: the child could have read the signing key.

A 1.x audit log (`audit/audit_events.jsonl`) is recognised and reported as "legacy format, not verifiable" (exit 1).

Exit codes: **0** valid, **1** invalid, **2** the bundle cannot be read (absent, not a directory or tar archive, unsafe archive member, unknown format version, unreadable `--key`).

## `akios report --export`

```
akios report [RUN] --export <dir> [--archive tar|tar.gz] [--json]
```

Writes the export bundle of a run kept in the store (`$XDG_STATE_HOME/akios/runs/<run>/`, default `~/.local/state/akios/runs/`): a directory `<dir>/akios-run-<run>` with `ledger.jsonl`, `checkpoints.jsonl`, `policy.json`, `pubkey.pem` and a `manifest.json` of their SHA-256 digests ([ledger v0 §5](/docs/ledger-v0.html#5-storage-and-export-bundle)), or with `--archive`, one `.tar` or `.tar.gz` of that directory, `<dir>/akios-run-<run>.tar.gz`. `<dir>` is a directory: a name that ends like an archive (`.tar`, `.tar.gz`, `.tgz`) and is not an existing directory is refused (exit 2), with the `--archive` form to use. `RUN` is a run id, a unique prefix of at least 4 characters, or `last` (the default). An existing bundle is never overwritten.

## `akios report` (the report)

```
akios report [BUNDLE | RUN] [--format md|html] [--output <file>] [--key <pubkey.pem or key_id>] [--json]
```

Verifies a bundle (a directory or archive), or a stored run (a run id, a unique prefix, or `last`, the default), then prints a human-readable report in Markdown, or a standalone HTML page with `--format html`: the verification result first (and every failure), whether the evidence is trusted, the command (redacted), the host (the Landlock ABI on Linux; the macOS version and whether Seatbelt was available on macOS), the policy, each clause with whether it was needed and enforced, and by which mechanism or why not, the outcome, wall and CPU time and peak memory, the resource limits against what was used and any limit that ended the run, the denials, errors, and redaction counts. The command is quoted as a shell would read it. On macOS the denials are those of the run's `denials` event: the total, and each operation with its path, its count and the programs, first a write refused on a path the policy keeps read-only, labelled as such, then the others as recorded (reads that did not fit grouped by folder, with the number of paths), and whether the record is complete; on Linux, and when nothing was captured, the report says they were not captured and why ([troubleshooting](/docs/troubleshooting.html#denials)). Paths of `filesystem.protect` are listed with the policy, and the clause with the others. It ends with what a valid result does not show. It gives no compliance or conformity verdict. Exit code 0 when the evidence verifies, 1 when it does not (the report says so at the top), 2 when it cannot be read.

## `akios policy`

```
akios policy validate <policy> [--json]
akios policy explain <policy> [--command CMD] [--json]
akios policy test <sample> [--json]
```

- `validate` checks a policy against the [policy language v0](/docs/policy-v0.html): strict YAML (or JSON for a `.json` file), the schema, path resolution (relative to the policy's directory, `~` for the home directory, `$TMPDIR` for the temporary directory, `$DEVELOPER_DIR` for the developer tools of macOS, symbolic links followed), the reserved paths (the ledger store and the key directory, their ancestors and anything inside them), and that each path of `filesystem.protect` lies inside a `filesystem.write` path. It lists every issue with its location, and the paths that do not exist (they grant nothing). Exit 0 valid, 1 invalid.
- `explain` prints, for this host, each clause, whether the policy needs it enforced, whether this host can, the mechanism (Landlock, seccomp, network namespace and, for `filesystem.protect`, mount namespace on Linux; Seatbelt on macOS; rlimits, watchdog) and, when it cannot, why; then what `akios run` would do: start, start degraded, or refuse with exit 3. On macOS it also prints a summary of the Seatbelt profile, the read-only platform base, and the folders guarded with privacy prompts that the policy grants. With `--command CMD` (the command as one string, for example `--command "python3 agent.py"`), it also runs the command check of `akios run` from the current directory ([policy v0 §6.1](/docs/policy-v0.html#61-the-command-check)) and says at the end whether `akios run` would start that command, or refuse it, naming each path to add and its clause; on macOS it first names the developer tool each shim of `/usr/bin` in the command runs, as `xcrun --find` gives it ([policy v0 §5.7](/docs/policy-v0.html#57-macos-seatbelt)); and when the policy grants git's configuration or a folder of developer tools, and the first `git`, `python3`, `make` or `clang` on the run's `PATH` is a shim the cage lets run but the developer tools it loads (`xcode-select -p`) cannot be read under the policy, one line that names the folder, as `akios run` prints it before the run; with `--json`, under `command` (`issue`, the first file; `issues`, all of them; `developer_tools`; `notes`). With `--command`, it exits with code **3** when `akios run` would refuse the command, as `akios run` would, and 0 when it would start it; without `--command`, 0.
- `test` runs the PII and secret redaction that AKIOS applies to what it records on a text file, and prints the redacted text and the counts per kind. It replaces `akios protect scan`. It does not see what a program sends itself.

## `akios doctor`

Prints what this host and this installation can do for `akios run`: Python version; required packages; the signing key (present, mode 0600, its `key_id`; a key readable by others is a failure); the ledger store (mode 0700, number of runs); disk space where it lives; the PII engine and a detection self-test; and **Enforcement**: for each mechanism `akios run` uses (on Linux: Landlock, seccomp, network namespace, mount namespace, watchdog, each rlimit, cgroups; on macOS: Seatbelt, the watchdog with the process sweep, each rlimit, the CPU sampler), whether this host and this version can apply it, and why not. On macOS it also shows the macOS version, the result of the Seatbelt self-test, System Integrity Protection, Developer Mode, and the folders macOS guards with privacy prompts. With `--policy <file>`, or when `./akios.policy.yaml` exists, it adds the policy's clause matrix, the same one `akios policy explain` prints and `akios run` records in its `preflight` event. `--json` prints the same as JSON. Exit 1 when a check fails.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success; `verify`: valid |
| 1 | Error (including a failed platform or security check); `verify`: invalid |
| 2 | Usage error; `verify`: unreadable bundle |
| 3 | `run`: refused (see above) |
| 130 | Interrupted |
