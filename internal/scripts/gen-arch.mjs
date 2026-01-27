import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const outDir = path.join(ROOT, 'site', 'assets', 'img');
const mmdPath = path.join(outDir, 'arch.mmd');
const svgPath = path.join(outDir, 'arch.svg');
const heroMmdPath = path.join(outDir, 'hero-arch.mmd');
const heroSvgPath = path.join(outDir, 'hero-arch.svg');

const diagram = `
flowchart LR
  %% Palette tuned to site theme (Zinc + Cyan)
  classDef core fill:#06b6d4,stroke:#06b6d4,stroke-width:3,color:#18181b,font-weight:700
  classDef layer fill:#ffffff,stroke:#06b6d4,stroke-width:2.25,color:#18181b,font-weight:650
  classDef aux fill:#fafafa,stroke:#e4e4e7,stroke-width:2,color:#52525b,font-weight:550

  %% Dark arrows for contrast
  linkStyle default stroke:#18181b,stroke-width:2.25,color:#18181b

  C[Client / CLI\\nAPI / SDK]:::layer
  C --> AK

  subgraph AK[AKIOS Runtime]
    direction TB
    style AK fill:#ecfeff,stroke:#06b6d4,stroke-width:2.5,color:#18181b,font-weight:750
    P[Policy Engine\\nexplicit allowlists]:::layer
    S[Sandbox\\nseccomp-bpf · cgroups · userns]:::layer
    R[PII Redaction\\ninputs + outputs]:::layer
    B[Budget & Loop Kills\\ncost + token limits]:::layer
    A[Audit Ledger\\nMerkle, signed logs]:::layer
    P --> S --> R --> B --> A
  end

  AK --> G[Agents\\nfilesystem / http / llm / tool]:::layer
  G --> T[Tools / APIs\\npolicy-gated effects]:::layer

  class C,AK,G,T core
`;

const heroDiagram = `
flowchart LR
  %% Macro, value-focused view for hero
  classDef core fill:#06b6d4,stroke:#06b6d4,stroke-width:3,color:#18181b,font-weight:700
  classDef layer fill:#ffffff,stroke:#06b6d4,stroke-width:2.25,color:#18181b,font-weight:650
  classDef aux fill:#fafafa,stroke:#e4e4e7,stroke-width:2,color:#52525b,font-weight:550
  linkStyle default stroke:#0f172a,stroke-width:2.25,color:#0f172a

  USERS[Teams & Workflows\\nCLI · CI/CD · SDK]:::layer

  subgraph AK[AKIOS Control Plane]
    direction TB
    POL[Explicit Policies\\nallowlists + budgets]:::layer
    SIG[Signed Config + Attest]:::layer
    POL --> SIG
  end

  subgraph RT[AKIOS Runtime Cage]
    direction TB
    SB[Kernel Sandbox\\nseccomp · userns · cgroups]:::layer
    PII[PII Redaction\\ninputs/outputs scrubbed]:::layer
    KILL[Budget & Loop Kills\\nstop runaway agents]:::layer
    AUD[Audit Trail\\nMerkle + signatures]:::layer
    SB --> PII --> KILL --> AUD
  end

  DEST[Tools / APIs / Data\\npolicy-gated actions]:::layer

  USERS --> AK --> RT --> DEST

  V1[Policy-as-code\\nsigned & enforced]:::aux
  V2[Every action attested\\nMerkle audit trail]:::aux

  POL -.-> V1
  AUD -.-> V2
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(mmdPath, diagram.trim() + '\n', 'utf-8');
fs.writeFileSync(heroMmdPath, heroDiagram.trim() + '\n', 'utf-8');

try {
  execSync(
    'npx -y @mermaid-js/mermaid-cli@10.9.1 -i site/assets/img/arch.mmd -o site/assets/img/arch.svg --backgroundColor transparent',
    { stdio: 'inherit' }
  );
  console.log('Generated SVG at', svgPath);
} catch (err) {
  console.error('Failed to generate SVG with mermaid-cli. Install/try again or generate manually.', err.message);
  process.exit(1);
}

try {
  execSync(
    'npx -y @mermaid-js/mermaid-cli@10.9.1 -i site/assets/img/hero-arch.mmd -o site/assets/img/hero-arch.svg --backgroundColor transparent',
    { stdio: 'inherit' }
  );
  console.log('Generated hero SVG at', heroSvgPath);
} catch (err) {
  console.error('Failed to generate hero SVG with mermaid-cli. Install/try again or generate manually.', err.message);
  process.exit(1);
}
