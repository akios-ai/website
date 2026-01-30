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
  classDef core fill:#06b6d4,stroke:#06b6d4,stroke-width:3,color:#ffffff,font-weight:700
  classDef layer fill:#ffffff,stroke:#06b6d4,stroke-width:2.25,color:#18181b,font-weight:650
  classDef input fill:#fafafa,stroke:#a1a1aa,stroke-width:2,color:#52525b,font-weight:600
  classDef safe fill:#06b6d4,stroke:#0891b2,stroke-width:2.5,color:#ffffff,font-weight:700

  %% Dark arrows for contrast
  linkStyle default stroke:#18181b,stroke-width:2.25,color:#18181b

  AG["<b>Untrusted Agents</b>\\nAI · LLMs · Third-party code"]:::input
  AG -->|requests| AK

  subgraph AK["<b>AKIOS Security Runtime</b>"]
    direction TB
    style AK fill:#ecfeff,stroke:#06b6d4,stroke-width:3,color:#0e7490,font-weight:800
    
    P["<b>Policy Engine</b>\\nAllowlist verification\\nPermission grants"]:::layer
    S["<b>Kernel Sandbox</b>\\nseccomp-bpf + cgroups v2\\nnamespace isolation"]:::layer
    R["<b>PII Redaction</b>\\nReal-time pattern matching\\nData masking engine"]:::layer
    B["<b>Budget & Loop Control</b>\\nToken limits · Cost tracking\\nRunaway detection"]:::layer
    A["<b>Audit Ledger</b>\\nMerkle tree · Signed logs\\nTamper-proof trail"]:::layer
    
    P --> S
    S --> R
    R --> B
    B --> A
    
    P -.->|enforces| R
    P -.->|enforces| B
    S -.->|isolates| R
    S -.->|isolates| B
  end

  AK -->|verified output| INFRA["<b>Protected Infrastructure</b>\\nAPIs · Databases\\nCloud services"]:::safe
`;

const heroDiagram = `
flowchart TB
  classDef core fill:#06b6d4,stroke:#06b6d4,stroke-width:3,color:#ffffff,font-weight:700
  classDef layer fill:#ffffff,stroke:#06b6d4,stroke-width:2,color:#18181b,font-weight:600
  classDef input fill:#f4f4f5,stroke:#a1a1aa,stroke-width:2,stroke-dasharray: 5 5,color:#52525b
  classDef badge fill:#0891b2,stroke:none,color:#ffffff,font-weight:600,font-size:12px,rx:12,ry:12
  
  linkStyle default stroke:#18181b,stroke-width:2,color:#18181b

  Src[Untrusted Agents]:::input

  subgraph AKIOS [AKIOS Secure Runtime]
    direction TB
    style AKIOS fill:#ecfeff,stroke:#06b6d4,stroke-width:3,color:#0e7490,font-weight:700,rx:8,ry:8
    
    subgraph PBox [ ]
      direction LR
      style PBox fill:#ffffff,stroke:#a5f3fc,stroke-width:2,rx:6,ry:6
      Guard[Guard]:::layer
      B1([Policy-as-Code]):::badge
      Guard --- B1
    end

    subgraph SBox [ ]
      direction LR
      style SBox fill:#ffffff,stroke:#a5f3fc,stroke-width:2,rx:6,ry:6
      Sandbox[Sandbox Kernel]:::layer
    end

    subgraph ABox [ ]
      direction LR
      style ABox fill:#ffffff,stroke:#a5f3fc,stroke-width:2,rx:6,ry:6
      Audit[Audit Ledger]:::layer
      B2([Attested Actions]):::badge
      Audit --- B2
    end
    
    PBox --> SBox --> ABox
  end

  Dest[Infrastructure]:::core

  Src --> PBox
  ABox --> Dest
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
    'npx -y @mermaid-js/mermaid-cli@10.9.1 -p internal/scripts/puppeteer-config.json -i site/assets/img/hero-arch.mmd -o site/assets/img/hero-arch.svg --backgroundColor transparent --width 600 --height 250',
    { stdio: 'inherit' }
  );
  console.log('Generated hero SVG at', heroSvgPath);
} catch (err) {
  console.error('Failed to generate hero SVG with mermaid-cli. Install/try again or generate manually.', err.message);
  process.exit(1);
}
