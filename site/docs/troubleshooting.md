---
source: TROUBLESHOOTING.md
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

# Troubleshooting (2.0 development)

AKIOS 1.x is no longer maintained. Coming from 1.x (workflows, templates, providers, `akios setup`, `akios audit`): see the [migration guide](/docs/migration-1x-to-2.html).

## `akios run` exits with code 3: "refused: this host cannot enforce what the policy needs"

Nothing was started. The message lists each clause and why (for example "Landlock unavailable: not Linux", or on macOS "resources.memory_mb: macOS has no memory limit for an unprivileged process"). `akios policy explain <policy>` and `akios doctor` show the same matrix. Either run on a host that can enforce it (Linux with Landlock ABI 3 or later and unprivileged user namespaces for `network: none`, or macOS where the Seatbelt self-test of `akios doctor` passes), change the policy (on macOS, remove `memory_mb`), or accept a degraded run with `--allow-degraded`; the ledger then records, before the command starts, what was not enforced.

## `akios run` exits with code 3: "refused: … cannot be executed under …" or "… cannot be read under …"

Nothing was started. Before the start, `akios run` checks the command against the policy: the program (found in `PATH`, symbolic links followed), its `#!` interpreter and, for Python, its virtual environment, its standard library, its script and, on macOS with `-c`, the working directory ([policy v0 §6.1](/docs/policy-v0.html#61-the-command-check)). The message names every file it found, each with the path to add and the clause, for example `add /opt/homebrew to filesystem.read in akios.policy.yaml`; add them all, then run again. `akios policy explain <policy> --command "<command>"` runs the same check without starting anything.

## `akios run` exits with code 2

A usage or configuration problem, and nothing was recorded: no policy (pass `--policy`, or create `akios.policy.yaml` with `akios init`), an invalid policy (the message lists each issue with its location), no signing key (run `akios init`), or a 1.x workflow file (workflows were removed in 2.0; see the [migration guide](/docs/migration-1x-to-2.html)).

## Denials

When the policy does not grant what the program does, the operating system refuses it to the program, which reports it in its own output, or not: an agent often carries on, and exits with code 0. On macOS, "Operation not permitted" (`EPERM`); on Linux, "Permission denied" (`EACCES`) for files and programs, and "Operation not permitted" (`EPERM`) for the system calls of the baseline.

On macOS, AKIOS records what the cage refused during the run, from the sandbox reports of the system log (`ledger.denials`, on by default, [policy v0 §5.6](/docs/policy-v0.html#56-ledger)): after the run, `akios run` prints one line such as `akios: the cage refused 14 operations (write ~/.codex/config.toml (kept read-only by the policy), network /private/var/run/mDNSResponder, read /opt/tools/share/x, and 4 more)`, whatever the exit code, and `akios report` lists each operation with its path, its count and the programs, in the order of that line. The line names first a write refused on a path the policy keeps read-only, then the other writes, the programs refused, the connections and the reads, several of one folder together (how many paths, and up to three of their names); a write to a cache folder (`~/Library/Caches`, `~/.cache`) comes after the reads, and what a shell reads at start and does without (`~/.zshenv`, `~/.zprofile`, `/dev/tty`) comes last, and so does `network` without an address, a kernel control socket (`AF_SYSTEM`), not IP traffic: the cage refuses it even with `network: all` (M-NET-02), and the programs seen so far do without it. macOS folds repeated reports and can drop some when many are written at once: the counts are a lower bound. On Linux nothing is recorded (Landlock and seccomp do not report their refusals by default; [threat model §8](/docs/threat-model.html#8-known-limitations-of-the-20-design)), and after a run that ended with a non-zero exit code, `akios run` prints one line that points here, whatever the cause.

- `akios policy explain <policy>` shows what the policy grants on this host, and `akios policy explain <policy> --command "<command>"` checks a command before you run it: the program, its `#!` interpreter and what Python reads at start.
- Grant the path in `filesystem.read`, `filesystem.write` or `exec`, as narrow as the program needs, never `~` as a whole.
- On macOS, `akios report` lists the run's denials; the system log holds each one too, with the program and the path: see [reading the sandbox denials of a run](#reading-the-sandbox-denials-of-a-run), and the other cases [below](#macos).
- A denial of a path the policy keeps read-only with `filesystem.protect` is the policy working: change that file outside `akios run`.

## "… contains the reserved path …: grant a narrower path", "… is inside the reserved path …: remove it"

A policy may not grant the ledger store (`~/.local/state/akios`) or the key directory (`~/.config/akios/keys`), nor any directory above them such as `~` or `~/.config`, nor anything inside them: the command could read the signing key or edit the evidence. The message names the policy entry at fault, by its location (`/filesystem/read/0` is the first path of `filesystem.read`). Grant narrower paths, for example the project and `~/.cache` instead of `~`.

## The program cannot change the policy file, or `akios run` says "the policy file … changed since run …"

On macOS the policy file of a run is read-only inside the cage, also when it sits in a directory the policy grants for writing, as the starter policy does: writing, replacing, renaming or deleting it fails with "Operation not permitted", and so does renaming or removing a granted folder above it. A program that must not change its own policy cannot. To edit the policy, edit it outside `akios run`.

On Linux, Landlock cannot take one file out of a granted directory, so a program can rewrite a policy kept beneath a `write` path, and the next run applies it ([threat model §8](/docs/threat-model.html#8-known-limitations-of-the-20-design)). List the policy file in `filesystem.protect` (it is then read-only inside the cage, K-FS-07), or keep the policy outside the write paths and pass it with `--policy`. On both systems, `akios run` prints `akios: note: the policy file <path> changed since run <id>, the previous run with it (sha256 … then, … now)` when the file differs from the one the previous run with it used; if you did not change it, read it before the run goes on (Ctrl-C stops it). The ledger records the file's SHA-256 in `run_start`.

## Granting write on an agent's configuration folder

A write grant lets the program leave files that run later. With write access to its own configuration folder (for example `~/.config/<agent>` or `~/.<agent>`), an agent can change its settings, hooks, allow lists or the commands it starts; the next time it starts without AKIOS, those changes run outside the cage, with all of your access.

When the agent keeps its state in the same folder and needs it writable, list its configuration in `filesystem.protect` ([policy v0 §4.5](/docs/policy-v0.html#4-paths)): those paths stay read-only inside the grant (no write, creation, rename or removal; a folder with everything beneath it), and the rest of the folder stays writable (M-FS-07, K-FS-07). The [Codex example](https://github.com/akios-ai/akios/blob/main/docs/spec/examples/codex-macos.policy.yaml) protects `~/.codex/config.toml`, `~/.codex/hooks.json`, `~/.codex/rules`, `~/.codex/AGENTS.md` (instructions Codex reads at every start), `~/.codex/plugins` (Codex refreshes it at start: the refused writes are recorded, and Codex carries on), `~/.codex/automations` (tasks the Codex app runs on a schedule), `~/.codex/computer-use` (the app Codex launches for computer use) and `~/.codex/packages` (Codex installed with its standalone installer), and in the project `.git/hooks` and `.git/config`, which name what git runs later; it leaves `~/.codex/skills` writable, where Codex installs its skills at start, so review that folder before a run outside the cage. The agent then cannot change those settings from inside the cage (for example to trust a project): change them outside `akios run`. On Linux a protected path must exist before the run (otherwise the clause cannot be enforced: the run is refused unless it may start degraded, and the message names the path): create it, with content the agent accepts, or remove it from the list. Otherwise, grant the configuration folder for reading, grant write only on the narrowest path the agent needs (often a cache or session folder), and review what changed in the folder before you start the agent outside the cage.

## An agent's own sandbox does not start inside AKIOS

Some agents run the commands they generate in a sandbox of their own: on macOS a Seatbelt profile (`sandbox-exec`), on Linux a mount namespace (bubblewrap). Inside the cage neither can start: macOS refuses a second sandbox to a sandboxed process (M-SYS-01), and Landlock forbids mount operations ([threat model §8](/docs/threat-model.html#8-known-limitations-of-the-20-design)). The agent then reports that its sandbox failed, or refuses to run commands.

Switch the agent's own sandbox off, with the setting or flag its documentation gives for running commands without a sandbox (for Codex, `-s danger-full-access`: see [wrap Codex on macOS](/docs/getting-started.html#wrap-codex-on-macos)), and let AKIOS be the sandbox. The trade-off: the agent's sandbox applied to each command it ran, often more narrowly than to the agent (for example no network for the commands while the agent talks to its model); with it off, every command gets what the policy grants the agent as a whole. Write the policy for what those commands may do, not only for what the agent needs, and keep the agent's own approval of commands, if it has one, switched on.

## An agent installed in an unusual place

The command check of `akios run` follows the command to the files the system runs: the name found in `PATH`, symbolic links to their target, `#!` interpreters (often a `node` or `python` installation of its own). When it refuses, it names each file and the path to add; `akios policy explain akios.policy.yaml --command "<agent>"` gives the same answer before a run. Grant the folder it names, not a folder above it.

An agent installed and updated by a desktop application often lives in a folder whose name carries its version, and that path changes with each update: a policy that names it stops matching, and the next run is refused with the new path. Grant the folder that holds the versions when it holds nothing else, or update the policy after each update.

## `akios verify` says INVALID, or "UNTRUSTED"

INVALID lists every rule that failed (for example R7: a signature or a checkpoint head does not match). UNTRUSTED on a valid bundle means the filesystem clause was not enforced during the run, so the command could have read the signing key. See [ledger v0 §6](/docs/ledger-v0.html#6-verification).

## `akios: error: argument COMMAND: invalid choice`

The command was removed in 2.0: `audit`, `setup`, `templates`, `workflow`, `status`, `logs`, `timeline`, `output`, `files`, `clean`, `testing`, `docs`, `cage`, `security`, `protect`, `http`, `compliance`, `serve`, `dashboard`. The [migration guide](/docs/migration-1x-to-2.html) says what replaces each. This version has `init`, `policy`, `run`, `verify`, `report` and `doctor`.

## An old `config.yaml`

The 2.0 commands do not read it. What a run may do is in its policy.

## A program no longer sees `AKIOS_DEBUG_ENABLED` or `AKIOS_JSON_MODE`

With `environment.pass: all`, the program receives the environment AKIOS was started with. The CLI no longer adds these two variables to it; a program that reads them gets them only when they are set in the shell that starts `akios`.

## macOS

On macOS one Seatbelt profile per run enforces the policy ([policy v0 §5.7](/docs/policy-v0.html#57-macos-seatbelt)). A denied operation fails with "Operation not permitted" (`EPERM`). `akios policy explain <policy>` prints the profile's summary and the read-only platform base. The starter policy `akios init` writes on a Mac already grants what it finds there: the installation of each Python on `PATH`, Homebrew, the Command Line Tools, this directory for reading and `$TMPDIR` for writing.

### Reading the sandbox denials of a run

`akios report` lists what the cage refused during a run (with `ledger.denials`, the default). To watch the reports themselves, as they come: Seatbelt reports each denial to the system log, with the program's name and process id, the operation, and the path or the service, and each report of an `akios run` is followed by a line with the run's marker, `org.akios.run.<run id>`. Start a stream of these reports before the run, and stop it after:

```
/usr/bin/log stream --style compact --predicate 'sender == "Sandbox"' > denials.txt &
sleep 1; akios run -- <command>
kill $!; grep deny denials.txt
```

The stream holds the reports of every program of the Mac: keep the reports of one run with its id (`akios run` prints it), `grep -B1 <run id> denials.txt`, or the lines with your command's programs, for example `grep 'git(' denials.txt`. A line such as `Sandbox: git(4242) deny(1) file-read-data /opt/tools/share/x` says what was refused: `file-read-data` or `file-write-create` a path, `process-exec` a program, `mach-lookup` a system service, `network-outbound` a connection (with no address: a kernel control socket, not IP traffic). Grant the path in the policy if the program needs it; a system service is not grantable. In zsh, type `/usr/bin/log`: `log` alone is a shell builtin. macOS limits these reports: it folds repeated ones into "N duplicate reports", and after a flood it can stop reporting for a while, so an empty result does not prove that nothing was denied. Two denials that nearly every program meets at start and does without are not reported: writing `/dev/dtracehelper` and reading `/Library/Preferences/Logging/com.apple.diagnosticd.filter.plist`. AKIOS's own checks of the run's processes are not reported.

### `akios report` says "Denials: not captured" on macOS

The wrapper reads the run's sandbox reports with `/usr/bin/log stream`. macOS keeps much of its `log` command to administrators: `/usr/bin/log` holds the message `Must be admin to run '%s' command`, and Apple's developer support says that many `log` commands require an administrator account. Run as a standard account, the reader either refuses, or runs and delivers nothing, as has been reported for some versions; AKIOS does not ask for administrator rights, and the run goes on. Either way the record says that nothing was captured, and why, for example `Denials: not captured (the system log delivered nothing for this run: the system log reader ended before the command started (log: Must be admin to run 'stream' command))`, or, for a reader that delivered nothing, `... the system log reader was not confirmed ready within 2 s: ...`. The program's output still shows each refusal ("Operation not permitted"), and `ledger.denials: false` turns the reader off. A standard account was not tested: the tests fake the reader's refusal and its silence (`tests/unit/test_run/test_denials.py`).

### An agent says "Not logged in", or reports a Keychain error

The Keychain is reached through the security server, a system service the cage does not let a program reach (M-SYS-01), so a sign-in the agent keeps there is not available inside the cage. Use an API key instead, in an environment variable passed by name: set it in the shell that starts `akios`, and list its name in the policy, `environment: {pass: [<NAME>]}`. The agent sees the key; the ledger records the variable's name, never its value.

### Certificate errors: `UnknownIssuer`, "unable to get local issuer certificate"

A program that loads the system's trusted certificates through the Security framework reads them from the keychains, through the security server too, which the cage does not reach: with `network: all` it connects, then rejects every certificate. On macOS, when the policy allows network, `akios run` sets `SSL_CERT_FILE=/etc/ssl/cert.pem` for the program unless it is already set, and the platform base lets the run read that file ([policy v0 §5.4](/docs/policy-v0.html#54-environment), M-NET-03): programs that honour the variable, such as those built on OpenSSL, find the certificates there. A program that ignores it needs to be told, with the option its documentation gives for a certificate file. To use other certificates, set `SSL_CERT_FILE` or `SSL_CERT_DIR` in the shell that starts `akios`: both pass to the program with the base set.

### A command fails with "Operation not permitted", or with an `xcrun` error

Something the program opens after it starts is not in a granted path: the command check of `akios run` covers only the program, its interpreter and what Python reads at start. Add the installation to `filesystem.read`: `/opt/homebrew` (Homebrew on Apple Silicon; on Intel, `/usr/local` is beneath `/usr`), a virtual environment and the installation it was created from, or `/Library/Frameworks/Python.framework`. `/usr/bin/python3`, `/usr/bin/git`, `make` and the other developer tools in `/usr/bin` load the developer tools that `xcode-select -p` prints (Xcode's, or `/Library/Developer/CommandLineTools`): without them readable, they fail with `xcrun: error: unable to load libxcrun`. Grant `$DEVELOPER_DIR` in `filesystem.read`, which names that folder on any Mac ([policy v0 §4](/docs/policy-v0.html#4-paths)); when a policy that grants git's configuration or another folder of developer tools lets the shims on `PATH` run but not load it, `akios run` and `akios policy explain --command` say so in one line before the run.

When the program itself starts a developer tool of `/usr/bin` (`git`, `clang`, `python3` from a script), the tool is found in the lookup cache of `xcrun`, which the cage can read ([policy v0 §5.7](/docs/policy-v0.html#57-macos-seatbelt)). If the cache does not hold that tool yet and the developer tools are Xcode, the tool fails in the cage with an `xcrun` or `xcodebuild` error: run `xcrun --find <tool>` once outside the cage, then the run again. `akios run` does this itself for its command.

### A script runs outside the cage but not with an `exec` list

With an `exec` list, a script's `#!` interpreter must be listed too, and a symbolic link is checked at its target: `/opt/homebrew/bin/python3` points into `/opt/homebrew/Cellar`, so list `/opt/homebrew` or the Cellar path. `/bin/sh` runs another shell, `/bin/bash` by default: list both. With `exec: any`, the interpreter only needs to be readable.

### Python fails with `PermissionError` in `os.getcwd()`

On macOS, reading the path of the working directory (`os.getcwd()`) needs read access to it, and before Python 3.14 so does the first import with `-c`, which `akios run` checks before the start. The starter policy grants `.` for reading; a policy written by hand grants the directory the command runs in, or `akios run` is started from a granted directory.

### Temporary files end up in the working directory, or cannot be created

Programs write temporary files to `$TMPDIR`, a per-user folder beneath `/private/var/folders`, not to `/tmp`. A policy grants it with the path `$TMPDIR` in `filesystem.write`, which `akios run` resolves when it starts ([policy v0 §4](/docs/policy-v0.html#4-paths)); the starter policy of `akios init` on macOS has it. Python falls back to the working directory when no temporary directory is writable. zsh writes its here-documents to `/tmp/zsh…` unless `TMPPREFIX` says otherwise: `akios run` sets `TMPPREFIX=$TMPDIR/zsh` when it is not set ([policy v0 §5.4](/docs/policy-v0.html#54-environment)).

### macOS asks for access to Desktop, Documents, Downloads or iCloud Drive

macOS guards these folders with privacy prompts, and attributes the access to the terminal application, not to AKIOS. A policy grants such a folder only by listing it, or a path inside it; macOS may then ask, or deny access without asking. A policy that would grant one only through a broader path, such as `~/Library`, is refused, and the message names the entry: "the Seatbelt profile cannot be built: filesystem.read '~/Library' contains ~/Library/Mobile Documents, which macOS guards with privacy prompts: grant a narrower path, or list ~/Library/Mobile Documents itself". `akios doctor` lists the folders.

### `ps`, `top` or `pgrep` fail inside the cage

Setuid programs do not start in the cage, and the process list is not available to the wrapped program. Tools that check for running processes report an error.

### A test suite cannot reach its own local server

With `network: none`, loopback is denied on macOS too. A program that runs its own server on `127.0.0.1` needs `network: all`.

### `memory_mb` makes every run refused

`memory_mb` is not enforced on macOS, and the starter policy `akios init` writes on a Mac has none. Remove it from a policy used on macOS, or allow a degraded run (`--allow-degraded`, or `on_unenforceable: degrade`); the ledger records that it was not enforced.
