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
  %% Palette tuned to hero section; darker arrows for contrast
  classDef core fill:#06b6d4,stroke:#06b6d4,stroke-width:3,color:#18181b,font-weight:700
  classDef layer fill:#ffffff,stroke:#06b6d4,stroke-width:2.25,color:#18181b,font-weight:650
  classDef aux fill:#fafafa,stroke:#e4e4e7,stroke-width:2,color:#52525b,font-weight:550
  linkStyle default stroke:#18181b,stroke-width:2.25,color:#18181b

  U[Clients / CLI / SDK]:::layer
  CI[CI/CD & Automation]:::layer
  APP[AI Apps & Agents]:::layer

  subgraph CP[Control Plane]
    direction TB
    PR[Policy Repo + Signer]:::layer
    PE[Policy Engine]:::layer
    PR --> PE
  end

  subgraph DP[Data Plane]
    direction TB
    OR[Runtime Orchestrator]:::layer
    SB[Sandbox Kernel\\nseccomp · cgroups · userns]:::layer
    PII[PII Guard\\nredaction + filtering]:::layer
    BGT[Cost & Loop Guard\\nbudget / stalls]:::layer
    AUD[Audit & Attestation\\nMerkle + signatures]:::layer
    OR --> SB --> PII --> BGT --> AUD
  end

  DEST[Destinations\\nAPIs · DBs · Cloud · Tools]:::layer

  U --> CP
  CI --> CP
  APP --> DP
  CP --> DP
  DP --> DEST

  class U,CI,APP,CP,DP,DEST core
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
