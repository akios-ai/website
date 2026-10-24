---
source: docs/README.md
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

# AKIOS documentation

This is the documentation of **AKIOS 2.0**, in development: a cage you put around a program you already run, instead of a framework you write your agent in. Its enforcement has passed the kernel proof suite on Linux and the macOS substrate proof suite on macOS, run locally on 2026-10-11 and in CI on 2026-10-12, on 2026-10-16 and on 2026-10-24; each document says what is tested where. AKIOS 1.x (YAML workflows, built-in agents, model providers) is no longer maintained; see the [migration guide](/docs/migration-1x-to-2.html).

## The design

- [Why containment](/docs/why-containment.html): the thesis, in one page.
- [Threat model](/docs/threat-model.html): what is protected, against whom, the test that checks each property, and where and when it passed. Section 9 says what 2.0 changes compared with 1.x.
- [Policy language v0](/docs/policy-v0.html), with [example policies](https://github.com/akios-ai/akios/tree/main/docs/spec/examples/) and the JSON Schema in `src/akios/policy/schema/policy-v0.json`.
- [Evidence format v0](/docs/ledger-v0.html): the signed ledger and the export bundle that `akios verify` checks.
- [Formal model](https://github.com/akios-ai/akios/blob/main/docs/tla/README.md) of the 2.0 run lifecycle (TLA+; not model-checked yet).

## Using this version

- [CLI reference](/docs/cli-reference.html): `init`, `policy`, `run`, `verify`, `report`, `doctor`.
- [Configuration](/docs/configuration.html): what the 1.x `config.yaml` still means (almost nothing in 2.0).
- [Examples](https://github.com/akios-ai/akios/blob/main/examples/README.md): programs to wrap, each with its policy.
