---
source: docs/why-containment.md
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

# Why containment

**Status:** 2026-09-29. This note explains the design of AKIOS 2.0. What 2.0 changes compared with 1.x is in [§9 of the threat model](/docs/threat-model.html#9-what-20-changes-compared-with-1x).

---

## The problem

An AI agent is a program whose next action is chosen by text it has just read. When that action is harmful, the cause can be a bug, an instruction hidden in a web page or a file, or a compromised dependency ([threat model §2](/docs/threat-model.html#2-adversaries)). From the operating system's point of view the three look the same: a process, running as you, opening files, starting programs and connecting to the network.

## Guardrails and containment answer different questions

**Guardrails** act on what goes into and comes out of the model: system prompts, input filters, output classifiers. They reduce how often an agent attempts something bad. They sit inside the loop that the attacker is trying to steer, they are probabilistic, and they no longer apply once the agent runs a tool directly.

**Containment** acts on what the process can do. Which files it can open, whether it can open a socket, how much CPU and memory it gets, how long it may run. The kernel refuses what the policy does not allow, whatever the model was persuaded to try.

Both are useful. Guardrails lower the rate of bad attempts; containment bounds the damage when one gets through. AKIOS does containment.

## Keep your agent, add the fence

AKIOS 1.x asked you to rewrite your agent as AKIOS workflows, with AKIOS agents and AKIOS model clients. People do not move their work into someone else's house.

AKIOS 2.0 is a fence around what you already run:

```bash
akios run --policy agent.policy.yaml -- <your command>
```

The command can be a coding agent, a Python script or a LangChain application. It keeps its own model, its own libraries and its own configuration. AKIOS starts it inside the policy and records what happened.

## What AKIOS is, and is not

AKIOS is:

- an open-source execution cage you put around an agent process (and later an in-process agent or a tool call);
- local: no account, no cloud, nothing leaves the machine unless the policy allows it;
- independent of the model provider: the agent brings its own model;
- a producer of evidence: every run leaves a ledger that a third party can check.

AKIOS is not an agent framework, a workflow engine, a model client, a cloud service, or an organisation-level governance or regulatory assessment tool.

## The contract, not the sand

What AKIOS offers is one contract, enforced and proven for each run:

1. a **declared policy**: which files may be read or written, which programs may run, network or none, resource limits ([policy language v0](/docs/policy-v0.html));
2. **enforcement at the operating-system boundary**, not in the prompt: Landlock, seccomp and namespaces on Linux, a Seatbelt profile on macOS, without root ([threat model §5](/docs/threat-model.html#5-what-each-mechanism-enforces-linux) and [§5a](/docs/threat-model.html#5a-what-each-mechanism-enforces-macos));
3. **fail closed**: if this host cannot enforce a clause, the run does not start, unless you accept a degraded run, and then the ledger says so;
4. **redaction** of personal data and secrets in what AKIOS records and exports;
5. a **signed ledger** that anyone can verify on any machine, and against the key they expect with `--key` ([evidence format v0](/docs/ledger-v0.html));
6. a **formal model** of the run lifecycle, whose invariants are to be checked by a model checker in CI ([TLA+](https://github.com/akios-ai/akios/blob/main/docs/tla/README.md)).

The threat model names the test behind each part, and where and when it passed; a part is a claim only once its test passes in CI. Checking the formal model in CI is planned.

Each part exists elsewhere. The combination, local and open, is the point: a policy you can read, enforcement that does not depend on the agent's good will, and evidence you can hand to someone who was not there.

## Where microVMs and platform sandboxes fit

gVisor, Firecracker and other microVMs, container sandboxes, and the sandboxes that agent vendors ship inside their own products isolate more strongly than an unprivileged cage sharing the host kernel (Landlock and seccomp on Linux, Seatbelt on macOS). AKIOS does not compete on isolation depth.

It is complementary. You can run `akios run` inside a microVM: the policy and the ledger stay the same whatever isolates the process underneath. The isolation mechanism is replaceable; the policy language and the evidence format are the stable part. As a rule of thumb:

- to protect the host kernel from untrusted code, use a microVM;
- to declare what an agent may do, have the operating system hold it to that, and keep a signed record of what it did, use AKIOS;
- for both, use both.

## Limits, stated up front

- AKIOS 2.0 enforces on Linux and macOS; `memory_mb` is not enforced on macOS. On Windows it verifies and reports, and runs only in a recorded degraded mode.
- Network is all or nothing in 2.0; there is no domain allowlist and no inspection of encrypted traffic.
- The kernel and the invoking user's own session are trusted.
- A valid ledger proves integrity relative to a signing key, not the identity of a machine.

The [threat model](/docs/threat-model.html) lists every property with the test that checks it, and what is out of scope.

## Beyond software agents

The same contract (declared policy, enforcement by the platform, verifiable evidence) applies to other autonomous systems, such as a robot controller, with other enforcement mechanisms underneath. That is a longer-term direction, not part of 2.0.
