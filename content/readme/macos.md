---
source: README.md, section "What is enforced on macOS"
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

One Seatbelt profile per run, the sandbox built into macOS, enforces `baseline`, `filesystem`, `exec` and `network`; the wrapped program and every process it starts inherit it and cannot lift it. The `M-*` tests are the macOS substrate proof suite (`tests/macos/`); they require macOS. Every one of them passed in CI on 2026-10-24 on the `macos-latest` runner (macOS 26.6.2, arm64). Before the symbolic-link case of M-FS-06 and the hard-link case of M-FS-07 were added, on 2026-10-17, every one of them passed in CI on 2026-10-16 on that runner; all but M-NET-03, M-FS-07 and M-SYS-02 also passed on macOS 26.6.2 (Apple Silicon), run locally on 2026-10-11, and in CI on 2026-10-12 on that runner; those three passed on macOS 26.6.2 (Apple Silicon), run locally on 2026-10-16.

| Clause | Property | Mechanism | Test |
|---|---|---|---|
| `filesystem`, `exec` | Reading, writing, creating, deleting or executing outside the granted paths fails with `EPERM`; renaming, linking, cloning, truncating and appending follow the same rules; with an `exec` list, only files under it can be executed, `#!` interpreters and symbolic-link targets included | Seatbelt | M-FS-01 to M-FS-04 |
| Reserved paths | The signing key and the ledger store are unreachable, also inside a granted directory, and a policy that grants them is rejected | Seatbelt, policy validation | M-FS-05 |
| Policy file | The policy file of the run is read-only inside the cage, also inside a granted directory: it cannot be written, replaced, linked, renamed or deleted, and a granted folder that holds it cannot be moved aside | Seatbelt | M-FS-06 |
| `filesystem.protect` | Paths the policy keeps read-only inside a write grant cannot be written, created, replaced, linked, renamed or deleted, and the folder that holds them cannot be moved aside | Seatbelt | M-FS-07 |
| Baseline | Setuid and setgid programs do not start, a second sandbox cannot be applied, and system services outside a fixed list of six look absent | Seatbelt, deny by default | M-SYS-01 |
| Denials | What the cage refused to the program and its descendants is recorded in the ledger, from the sandbox reports of the system log, and `akios run` and `akios report` name it, also after exit code 0 | Seatbelt reports carrying the run's marker | M-SYS-02 |
| `network: none` | TCP, UDP and name resolution fail, loopback included; Unix-domain sockets work only beneath write paths | Seatbelt | M-NET-01 |
| `network: all` | IP traffic and name resolution work; Unix-domain sockets outside the write paths still fail | Seatbelt | M-NET-02 |
| `network: all` | A TLS connection verifies the server's certificate with the system's certificates | Seatbelt, wrapper | M-NET-03 |
| `resources` | CPU time and file size are capped, also for a program that ignores `SIGXCPU` or reads its own CPU time; at the wall-clock limit the run is stopped, and a descendant that left the process group is killed | rlimits, the wrapper's CPU sampler, watchdog, process sweep | M-RES-01, M-PROC-02, R-RES-02 |
| `environment` | The program receives only the environment variables the policy passes | the wrapper | R-ENV-01 |
| Wrapper | The program cannot signal the wrapper, obtain its task port, or read the values of the variables the wrapper did not pass | Seatbelt, the wrapper | M-PROC-01 |
| Terminal | An interactive program works on the run's own terminal; another terminal device cannot be opened | Seatbelt | M-TTY-01 |

`memory_mb` is not enforced on macOS. Other processes of the same user can read each other's initial environment on macOS; AKIOS overwrites the unpassed values in its own. The other differences from Linux are in [policy v0 §5.7](/docs/policy-v0.html#57-macos-seatbelt) and [threat model §8](/docs/threat-model.html#8-known-limitations-of-the-20-design).

Requirements: macOS on Apple Silicon (tested: macOS 26.6.2, with Python 3.12); Python 3.10 to 3.14; no root and no entitlement. `akios doctor` runs a self-test of the sandbox.
