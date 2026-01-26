# Diagram generation

This site uses Mermaid to keep diagrams consistent with the visual theme and regenerate them during builds.

## What gets generated
- `site/assets/img/arch.mmd` → `site/assets/img/arch.svg` (architecture section)
- `site/assets/img/hero-arch.mmd` → `site/assets/img/hero-arch.svg` (hero right-column graphic)

Both sources are authored inside `internal/scripts/gen-arch.mjs` and written to disk before rendering.

## How to regenerate
```bash
# From repo root
node internal/scripts/gen-arch.mjs
npm run build
```

The script runs `@mermaid-js/mermaid-cli` (pinned version in the command). Output SVGs are transparent-background and use the site color tokens baked into the template.

## Tweaking visuals
- Edit colors, stroke widths, or labels in `gen-arch.mjs` under the `classDef` blocks and node definitions.
- Regenerate and rebuild to propagate changes to `dist/index.html` and `dist/fr/index.html`.
