---
source: README.md, section "What is enforced on Linux"
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

Each row holds for the wrapped program and all its descendants. The test identifiers are those of the [threat model](/docs/threat-model.html); its [test index](/docs/threat-model.html#10-test-index) gives the file of each test, where it runs, and where and when it passed. The `K-*` tests are the kernel proof suite (`tests/kernel/`); they require Linux. Every one of them except the deferred K-RES-03, K-FS-07 and K-PROC-02 passed on Linux 6.12.95 (Debian, aarch64 and x86_64, Landlock ABI 6), run locally through Docker Desktop on macOS on 2026-10-11, on Linux 6.8.0-147 (Ubuntu 24.04, Landlock ABI 4) and 6.5.0-45 (Ubuntu 22.04, Landlock ABI 3), aarch64 and x86_64, run the same way on 2026-10-15, and in CI on 2026-10-12 and on 2026-10-16 on the `ubuntu-latest` runner (Ubuntu 24.04, Linux 6.17, x86_64, Landlock ABI 7); K-FS-07 passed on Linux 6.12.95 (Debian, aarch64), run locally on 2026-10-16, and in CI on 2026-10-16 on that runner. In CI on 2026-10-24, on that runner (Linux 6.17.0-1022-azure), every one of them but the deferred K-RES-03 passed, among them K-FS-07 with its symbolic-link and hard-link cases, and K-PROC-02, added on 2026-10-17, on its side from Landlock ABI 6 (signals scoped); its side below Linux 6.12 has run locally only ([threat model §8](/docs/threat-model.html#8-known-limitations-of-the-20-design)).

| Clause | Property | Mechanism | Test |
|---|---|---|---|
| `filesystem`, `exec` | Reading, writing, creating, deleting or executing outside the granted paths fails with `EACCES`; renaming, linking and truncating follow the same rules; with an `exec` list, only files under it can be executed | Landlock, ABI 3 (Linux 6.2) or later | K-FS-01 to K-FS-04 |
| Reserved paths | The signing key and the ledger store are unreachable, and a policy that grants them is rejected | Landlock, policy validation | K-FS-05 |
| `filesystem.protect` | Paths the policy keeps read-only inside a write grant cannot be written, created, renamed or deleted, and the program cannot unmount them | read-only bind mounts in the run's own mount namespace, unprivileged user namespaces | K-FS-07 |
| Baseline | Kernel modules, kexec, mount, ptrace and process-memory calls, bpf, perf, keyrings, userfaultfd, io_uring, unshare, setns and other calls return `EPERM` | seccomp after `PR_SET_NO_NEW_PRIVS`, no root | K-SYS-01 |
| `network: none` | In a new network namespace only the loopback is up and no route leads out; without unprivileged namespaces, IPv4 and IPv6 sockets are denied and the ledger records the fallback | user and network namespaces; seccomp | K-NET-01, K-NET-02 |
| `resources` | CPU time, address space and file size are capped; at the wall-clock limit the process group is stopped and the ledger records it | rlimits, watchdog | R-RES-01, R-RES-02 |
| `environment` | The program receives only the environment variables the policy passes | the wrapper | R-ENV-01 |
| Wrapper | The program cannot read or write the wrapper's memory | `PR_SET_DUMPABLE 0`, seccomp | K-PROC-01 |
| Signals | From Linux 6.12, the program cannot signal the wrapper or any other process outside the run (`EPERM`). Below Linux 6.12 it can: a run whose wrapper it kills ends without a final checkpoint and fails verification | Landlock ABI 6 signal scoping (Linux 6.12) | K-PROC-02 (in CI on Landlock ABI 7; the side below Linux 6.12 locally only, on Linux 6.11) |

Every known limit of 2.0, on Linux and on macOS, is listed in one place: [threat model §8](/docs/threat-model.html#8-known-limitations-of-the-20-design). Per-run memory and process accounting with cgroups v2: planned (K-RES-03). Out of scope, among others: kernel exploits, root, other processes of your own user outside the cage, the content of encrypted traffic ([threat model §3](/docs/threat-model.html#3-out-of-scope)).

Requirements: Linux with Landlock enabled (ABI 3, Linux 6.2 or later) for `filesystem` and `exec`, and unprivileged user namespaces for `network: none` and `filesystem.protect`; Python 3.10 to 3.14; no root.
