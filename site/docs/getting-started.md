---
source: GETTING_STARTED.md
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

# Getting started

AKIOS 2.0 is an alpha; 2.0.0a1 is a pre-release. AKIOS 1.x is no longer maintained: coming from 1.x, see the [migration guide](/docs/migration-1x-to-2.html).

## Install and run

On Python 3.10 to 3.14, in the directory where your program works:

```bash
pip install --pre akios
akios --help                          # init, policy, run, verify, report, doctor
akios init                            # writes akios.policy.yaml, creates the signing key
akios policy explain akios.policy.yaml --command "python3 -c 'print(1)'"   # would it start?
akios run -- python3 -c "print(1)"    # Linux, macOS: enforced; elsewhere: refused (exit 3)
akios run --allow-degraded -- python3 -c "print(1)"   # runs, and records what was not enforced
akios report                          # the report of the last run
akios report last --export out/ && akios verify out/akios-run-*/
```

Enforcement uses Landlock, seccomp and a network namespace on Linux, and one Seatbelt profile per run on macOS, where `memory_mb` is not enforced. On a host that cannot enforce the policy every run is refused or degraded, and the evidence of a run without the filesystem clause is marked untrusted. `verify`, `report` and `policy` have no platform check; `verify` passed in CI on Linux, macOS and Windows (`ubuntu-latest`, `macos-latest`, `windows-latest`), most recently on 2026-10-24. The [threat model](/docs/threat-model.html) says what each clause does and which test checks it.

On macOS, `akios init` also grants what it finds on the Mac: the installation of each Python on `PATH` (and of `./.venv`), Homebrew, the developer tools that `/usr/bin/python3` and `git` load (`xcode-select -p`) and the Command Line Tools, where they also look for their SDKs when Xcode is selected, this directory for reading and `$TMPDIR` for writing; the policy lists them with the reason for each, and has no `memory_mb`. Before the start, `akios run` checks the command (the program, its `#!` interpreter, what Python reads at start) and, when the policy does not grant it, refuses with two lines that name the path to add; `akios policy explain <policy> --command "<command>"` makes the same check without running anything. The [troubleshooting](/docs/troubleshooting.html#macos) page lists what else differs on macOS.

To work on AKIOS itself, install it from a clone of the repository instead: `python -m pip install -e .`.

## Wrap an example

The [examples](https://github.com/akios-ai/akios/blob/main/examples/README.md) are ordinary programs, each with its policy:

```bash
cd examples/shell-tool && akios run --policy policy.yaml -- python3 tool.py
```

The example policies are written with Linux paths and set `memory_mb`: on macOS they are refused as they are; start from the [macOS example](https://github.com/akios-ai/akios/blob/main/docs/spec/examples/coding-agent-macos.policy.yaml), and see the [examples](https://github.com/akios-ai/akios/blob/main/examples/README.md) page.

## Wrap Codex on macOS

[`codex-macos.policy.yaml`](https://github.com/akios-ai/akios/blob/main/docs/spec/examples/codex-macos.policy.yaml) is a policy for Codex working in one project. Write it to the project's root with `akios init --example codex` (the package holds it), or copy it there, then:

```bash
akios policy explain codex-macos.policy.yaml --command "codex"     # names any install folder to add
akios run --policy codex-macos.policy.yaml -- codex -s danger-full-access
akios run --policy codex-macos.policy.yaml -- codex exec -s danger-full-access "<task>"
```

Codex runs the commands it starts in a sandbox of its own (`sandbox-exec`). That sandbox cannot start inside the cage: macOS refuses a second sandbox to a sandboxed process (M-SYS-01), and every command then fails with `sandbox-exec: sandbox_apply: Operation not permitted`. With `-s danger-full-access`, Codex runs them without it, and AKIOS is the sandbox: the policy applies to Codex and to every process it starts (M-FS-01), and the ledger records the run. Write the policy for what those commands may do; see [an agent's own sandbox](/docs/troubleshooting.html#an-agents-own-sandbox-does-not-start-inside-akios).

Codex writes its state in `~/.codex`, where its configuration also lives. The policy grants the folder for writing and keeps `config.toml`, `hooks.json`, `rules`, `AGENTS.md`, `plugins`, `automations`, `computer-use` (the app Codex launches for computer use) and `packages` (Codex installed with its standalone installer) read-only in it, and in the project `.git/hooks` and `.git/config`, which git runs or follows the next time you use it there (`filesystem.protect`, M-FS-07): Codex cannot change, from inside the cage, what it or git runs, allows or follows the next time it starts outside it. Change those settings outside `akios run`. A protected path cannot be created in the cage either: in a new project, run `git init` before the run. `skills` stays writable, because Codex installs its skills there at start: review it before a run outside the cage. After the run, `akios run` names what the cage refused, also when Codex exits with code 0, and `akios report` lists it: the writes Codex tries at start on the protected paths come first, labelled as kept read-only by the policy.

The policy grants the developer tools with `$DEVELOPER_DIR`, the folder `xcode-select -p` prints (Xcode's, or the Command Line Tools), which `git` and the other developer tools of `/usr/bin` load, and `/Library/Developer/CommandLineTools`, where they also look for their SDKs when Xcode is selected. It lets Codex read `~/.agents/skills`, the skills shared between agents, which Codex loads at start: what they hold goes to the model like any instructions. The cage does not read your shell's start-up files (`~/.zshenv`, `~/.zprofile`) on purpose: the home directory is not granted, so the commands Codex runs through `zsh -lc` start without them, and the run's denials list those reads last. What Codex's commands need from them, `akios run` sets itself: `SSL_CERT_FILE` (the system's certificates, with network) and `TMPPREFIX` (where zsh writes its here-documents, beneath `$TMPDIR`); pass any other variable by name in `environment.pass`.

## Read the design

- [Why containment](/docs/why-containment.html)
- [Threat model](/docs/threat-model.html)
- [Policy language v0](/docs/policy-v0.html) and [evidence format v0](/docs/ledger-v0.html)
- [CLI reference](/docs/cli-reference.html) and [configuration](/docs/configuration.html)
