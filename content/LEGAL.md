---
source: LEGAL.md
note: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file
---

# AKIOS Legal Information & Disclaimers
**Revision:** 2026-10-06 (this document is revised independently of the software version)  

---

## Important Legal Notice

**AKIOS is open-source software provided free of charge.**

**Relationship to the GPL-3.0-only license:** This notice is informational. The GNU GPL-3.0-only license is the governing license for the AKIOS software. Nothing in this document adds restrictions beyond the GPL-3.0-only; in the event of any conflict, the GPL-3.0-only controls.

This document contains important legal information about your rights and responsibilities when using AKIOS. We recommend you read it carefully.

---

## Scope of the Security Software

AKIOS runs one program inside a declared policy, has the operating system enforce that policy, and records a signed ledger of the run. What AKIOS protects, against which adversaries, which mechanism enforces each property and which test checks it, and what is out of scope, are stated in the [threat model](/docs/threat-model.html). The threat model states what AKIOS aims to protect and what is out of scope. Enforcement substrates: Linux and macOS; the threat model's test index says where and when each test passed. `akios verify` and `akios report` have no platform check.

---

## License & Copyright

**Copyright © 2025-2026 AKIOUD AI, SAS**

AKIOS is free software licensed under the **GNU General Public License version 3 only (GPL-3.0-only)**.

You may:
- Use AKIOS for any purpose
- Modify the source code
- Distribute copies (modified or unmodified)
- Share improvements with the community

You must:
- Include the GPL-3.0-only license with any distribution
- Make source code available when distributing binaries
- Preserve copyright notices

**Full license text**: [LICENSE](https://github.com/akios-ai/akios/blob/main/LICENSE), the GNU GPL version 3 as published at https://www.gnu.org/licenses/gpl-3.0.txt

---

## Critical Disclaimers

### No Warranties
**AKIOS IS PROVIDED "AS IS" WITH NO WARRANTIES OF ANY KIND.**

We make **no guarantees** about:
- Security effectiveness (no system is 100% secure)
- AI output accuracy or safety
- Prevention of all possible harms
- Compliance with laws or regulations
- Suitability for any specific purpose

### User Responsibility
**YOU ARE SOLELY RESPONSIBLE FOR HOW YOU USE AKIOS.**

This includes responsibility for:
- Securing your environment and data
- Validating AI outputs before use
- Monitoring costs and resource usage
- Ensuring legal compliance in your jurisdiction
- Protecting sensitive information
- Preventing misuse or harmful applications

### AI-Specific Risks
**AI systems can produce harmful, biased, or incorrect outputs.**

AKIOS cannot prevent all risks associated with AI, including:
- Generation of harmful or inappropriate content
- Unpredictable AI behavior
- Biased or discriminatory outputs
- Privacy violations
- Unexpected costs or resource consumption
- Security vulnerabilities

**You must implement additional safeguards appropriate for your use case.**

---

## Limitation of Liability

**TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, AKIOUD AI, SAS, ITS CONTRIBUTORS, OR ANY OTHER PARTY INVOLVED IN CREATING, PRODUCING, OR DELIVERING AKIOS SHALL NOT BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY ARISING FROM OR RELATED TO YOUR USE OF AKIOS.**

This **complete exclusion of liability** applies to all damages including, but not limited to:
- **Direct damages**: Financial losses, data loss, system failures
- **Indirect damages**: Lost profits, business interruption, reputational harm
- **Consequential damages**: Legal penalties, regulatory fines, third-party claims
- **Special damages**: Personal injury, property damage, environmental harm
- **Punitive damages**: Any punitive or exemplary awards

**This exclusion applies even if:**
- We were advised of the possibility of such damages
- Such damages were foreseeable
- Our negligence or fault caused the harm
- Any limited remedy fails its essential purpose

**Carve-outs (where required by law):** This limitation does not exclude or limit liability where such exclusion is prohibited by applicable law, including for death or personal injury caused by negligence, gross negligence or willful misconduct, and any non-waivable statutory rights (e.g., certain consumer or product liability protections).

---

## Compliance & Regulatory Notice

**AKIOS does not guarantee compliance with any laws, regulations, or standards.**

Users are responsible for:
- EU AI Act compliance
- French and EU data protection law (GDPR, Loi Informatique et Libertés)
- Industry-specific regulations
- International export controls
- Organizational security standards

**For regulated environments requiring certifications or guarantees, consult legal experts and consider commercial alternatives.**

---

## Governing Law & Jurisdiction

*Note: This section applies to disputes about the website, services, or trademarks, not to rights granted under the GPL-3.0-only license.*

Operational disputes (non-GPL matters) are governed by **French law**.

Any such disputes shall be resolved in the courts of **Paris, France**.

---

## Legal Entity Information

**AKIOUD AI, SAS**  
8b rue Abel  
75012 Paris, France  

**Contact**: hello@akios.ai  

---

## Final Warnings

### Open Source Nature
AKIOS is open-source software published by AKIOUD AI. **We cannot control how others modify or use it.**

### No Professional Services
This software does not include professional services, support, or consulting.

### Regular Updates
Security and functionality can change. **Keep your installation updated and monitor for security advisories.**

### Export Controls
AKIOS may be subject to French and EU export control regulations. Users must comply with applicable laws.

---

---

## Responsibility Acceptance Guidelines

**For safe production use, we recommend you understand and acknowledge the following:**

### Infrastructure Responsibility

**AKIOS is NOT responsible for:**
- Infrastructure performance or availability (cloud, cluster or your own servers)
- Network latency, connectivity, or data transfer costs
- Cloud provider billing, charges, or cost overruns
- Instance configuration, sizing, or resource allocation
- Operating system security or updates
- Third-party service integrations or dependencies

**YOU are responsible for:**
- Choosing appropriate infrastructure for your workload
- Monitoring and controlling cloud provider costs
- Securing your infrastructure (firewalls, security groups, network policies)
- Maintaining your operating system and dependencies

### Data Security Responsibility

**AKIOS provides technical controls, within the scope of the [threat model](/docs/threat-model.html):**
- Policy enforcement for `akios run` on Linux (Landlock, seccomp, network namespace, resource limits) and on macOS (one system sandbox profile per run, resource limits; `memory_mb` is not enforced on macOS); each property and its test are listed in the threat model
- PII and secret redaction of what AKIOS records and exports (`akios policy test` shows what it redacts)
- A signed ledger of each run, checked with `akios verify`

**YOU must provide:**
- Infrastructure security (credentials, access controls, encryption)
- Data sensitivity classification (know what data you're processing)
- Compliance enforcement (your laws, your industry rules)
- Secret management (API keys, passwords, tokens)
- Monitoring and alerting (costs, suspicious activity, data access)

### Compliance Responsibility

**AKIOS cannot guarantee compliance.**

YOU are responsible for:
- Legal compliance in YOUR jurisdiction
- EU AI Act compliance (if applicable)
- Data protection laws (GDPR, HIPAA, etc.)
- Industry regulations (finance, healthcare, etc.)
- Contractual obligations (customer agreements, SLAs)
- Export control compliance (ITAR, EAR, etc.)

**For regulated environments:**
- Do NOT assume AKIOS satisfies compliance requirements
- Consult legal experts and compliance specialists
- Conduct thorough risk assessments
- Document your compliance justifications
- Consider professional support solutions

---

## Recommended Pre-Use Checklist

**We recommend you acknowledge the following before production deployment:**

1. **I understand the security capabilities and limitations**
   - AKIOS enforces the properties listed in the threat model, each checked by a named test, and redacts what it records
   - AKIOS does NOT provide absolute security or guarantee protection from all attacks
   - I am responsible for additional security measures appropriate to my use case

2. **I understand the scope of the security software**
   - I have read the threat model, including what is out of scope
   - `akios policy explain` shows what my host can enforce, and I check it before relying on a clause

3. **I understand the infrastructure responsibility**
   - AKIOS covers only the properties stated in the threat model
   - Cloud costs, security groups, networking, storage are MY responsibility
   - AKIOS will not reimburse unexpected infrastructure charges

4. **I understand the compliance responsibility**
   - AKIOS does not guarantee legal or regulatory compliance
   - I am responsible for compliance in MY jurisdiction
   - I will consult experts for regulated or high-risk deployments

5. **I understand the liability limits**
   - AKIOS is provided "as-is" with no warranties
   - AKIOS is not liable for damages from using AKIOS
   - Use of AKIOS is entirely at your own risk

**We recommend confirming these understandings by:**
- [ ] Reading this entire LEGAL.md document
- [ ] Reading the [threat model](/docs/threat-model.html)
- [ ] Testing AKIOS on my infrastructure before production use
- [ ] Monitoring costs and security of my deployment
- [ ] Consulting experts for compliance-sensitive use cases

---


## Source Code Availability for Distributions

If you distribute AKIOS in binary form (a wheel or a container image, for example), you must provide the complete corresponding source code (or a written offer) in accordance with GPL-3.0-only §6 (GPLv3 §6). Publish the source alongside the binaries or provide a documented retrieval method.

## Third-Party Components

AKIOS depends on third-party packages that are installed separately, and includes code derived from EnforceCore; see `THIRD_PARTY_LICENSES.md` and `NOTICE`. Comply with those licences when redistributing.
