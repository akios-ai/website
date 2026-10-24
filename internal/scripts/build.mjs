// Builds the site into dist/.
//
// - site/**/*.html: pages. The build replaces <!-- {{header}} -->, <!-- {{footer}} -->,
//   {{root}} (the relative path to the site root), {{version}}, {{canonical}}, and
//   <!-- {{include <file> [shift=N]}} --> (a Markdown file of content/, rendered,
//   its headings moved N levels down).
// - site/docs/*.md: the documentation, copied from the akios repository by
//   internal/scripts/sync-docs.mjs, rendered with the docs sidebar.
// - every other file of site/ is copied as it is.
//
// Also writes dist/sitemap.xml and dist/assets/search-index.json (the docs
// headings, for the search box). Exits with code 1 on any error.

import fs from 'fs-extra';
import path from 'path';
import { Marked } from 'marked';

const SRC_DIR = 'site';
const DIST_DIR = 'dist';
const PARTIALS_DIR = 'partials';
const CONTENT_DIR = 'content';
const SITE_URL = 'https://akios.ai';
const REPO = 'https://github.com/akios-ai/akios';

// Pages kept out of the sitemap (and given no pretty /name/ copy).
const NOT_IN_SITEMAP = new Set(['404.html', 'enforcecore/index.html', 'fr/index.html']);

// The documentation, in sidebar order: [file name without .md, label].
const DOCS_NAV = [
    ['Start', [
        ['index', 'Overview'],
        ['getting-started', 'Getting started'],
        ['migration-1x-to-2', 'Migrating from 1.x'],
    ]],
    ['Design', [
        ['why-containment', 'Why containment'],
        ['threat-model', 'Threat model'],
    ]],
    ['Specifications', [
        ['policy-v0', 'Policy language v0'],
        ['ledger-v0', 'Evidence format v0'],
    ]],
    ['Reference', [
        ['cli-reference', 'CLI reference'],
        ['configuration', 'Configuration'],
        ['troubleshooting', 'Troubleshooting'],
    ]],
];
const DOCS_ON_GITHUB = [
    ['Examples', `${REPO}/blob/main/examples/README.md`],
    ['Example policies', `${REPO}/tree/main/docs/spec/examples`],
    ['Formal model (TLA+)', `${REPO}/blob/main/docs/tla/README.md`],
    ['Roadmap', `${REPO}/blob/main/ROADMAP.md`],
    ['Changelog', `${REPO}/blob/main/CHANGELOG.md`],
];

const fail = (message) => {
    console.error(`build: ${message}`);
    process.exit(1);
};

// --- version.json: required ---
let version;
try {
    version = JSON.parse(fs.readFileSync('version.json', 'utf-8')).version;
} catch (error) {
    fail(`cannot read version.json (${error.message})`);
}
if (!version) fail('version.json has no "version"');

const readFile = (filePath) => fs.readFileSync(filePath, 'utf-8');

const escapeHtml = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const decodeHtml = (s) => s
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

// --- Markdown ---

const frontmatterOf = (raw) => {
    const meta = {};
    if (!raw.startsWith('---\n')) return { meta, body: raw };
    const end = raw.indexOf('\n---\n', 4);
    if (end === -1) return { meta, body: raw };
    for (const line of raw.slice(4, end).split('\n')) {
        const m = line.match(/^([\w-]+):\s*(.*)$/);
        if (m) meta[m[1]] = m[2];
    }
    return { meta, body: raw.slice(end + 5) };
};

// Heading anchors as GitHub makes them, so that links written for GitHub
// (docs/threat-model.md#8-known-limitations-of-the-20-design) work on the site.
const makeSlugger = () => {
    const seen = new Map();
    return (text) => {
        const base = text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '').replace(/ /g, '-');
        const count = seen.get(base) || 0;
        seen.set(base, count + 1);
        return count === 0 ? base : `${base}-${count}`;
    };
};

// Renders Markdown. Raw HTML in the source is shown as text: the copied
// documents contain none on purpose, and `<command>` in prose must stay visible.
const renderMarkdown = (markdown, { slugger, shift = 0, headings = null }) => {
    const marked = new Marked({ gfm: true });
    marked.use({
        renderer: {
            heading({ tokens, depth }) {
                const html = this.parser.parseInline(tokens);
                const text = decodeHtml(html);
                const id = slugger(text);
                if (headings) headings.push({ depth, text, id });
                const level = Math.min(6, depth + shift);
                return `<h${level} id="${id}">${html}</h${level}>\n`;
            },
            html({ text }) {
                return escapeHtml(text);
            },
        },
    });
    return marked.parse(markdown)
        .replace(/<table>/g, '<div class="table-wrap"><table>')
        .replace(/<\/table>/g, '</table></div>');
};

// --- Paths ---

// Relative path from a built file to the site root ("." at the root).
const rootFor = (relPath) => {
    if (relPath === '404.html') return ''; // served for any missing path: absolute links
    const depth = relPath.split('/').length - 1;
    return depth === 0 ? '.' : Array(depth).fill('..').join('/');
};

// "community.html" is also written as "community/index.html".
const prettyCopy = (relPath) => {
    if (!relPath.endsWith('.html') || path.posix.basename(relPath) === 'index.html') return null;
    if (NOT_IN_SITEMAP.has(relPath)) return null;
    return relPath.replace(/\.html$/, '/index.html');
};

const canonicalPathFor = (relPath) => '/' + relPath.replace(/(^|\/)index\.html$/, '$1');

// --- Partials ---

const headerTemplate = readFile(path.join(PARTIALS_DIR, 'header.html'));
const footerTemplate = readFile(path.join(PARTIALS_DIR, 'footer.html'));

// Function replacements: a "$" in the inserted text must stay as it is.
const fillCommon = (html, relPath) => html
    .replace('<!-- {{header}} -->', () => headerTemplate)
    .replace('<!-- {{footer}} -->', () => footerTemplate)
    .replace(/{{version}}/g, () => version)
    .replace(/{{canonical}}/g, () => SITE_URL + canonicalPathFor(relPath))
    .replace(/{{root}}/g, () => rootFor(relPath));

const built = [];
const writePage = async (relPath, html) => {
    for (const target of [relPath, prettyCopy(relPath)].filter(Boolean)) {
        const out = fillCommon(html, target);
        const left = out.match(/{{[^}]*}}/);
        if (left) fail(`${target}: unreplaced placeholder ${left[0]}`);
        await fs.outputFile(path.join(DIST_DIR, target), out);
    }
    built.push(relPath);
};

// --- HTML pages ---

const buildHtmlPage = async (relPath) => {
    let html = readFile(path.join(SRC_DIR, relPath));
    const slugger = makeSlugger();
    html = html.replace(/<!-- {{include ([^\s}]+)(?: shift=(\d))?}} -->/g, (_, file, shift) => {
        const source = path.join(CONTENT_DIR, file);
        if (!fs.existsSync(source)) fail(`${relPath}: included file ${source} does not exist`);
        const { body } = frontmatterOf(readFile(source));
        return renderMarkdown(body, { slugger, shift: Number(shift || 0) });
    });
    await writePage(relPath, html);
};

// --- Docs ---

const docsSidebar = (current) => {
    const sections = DOCS_NAV.map(([title, pages]) => {
        const items = pages.map(([name, label]) => {
            const href = name === 'index' ? '{{root}}/docs/' : `{{root}}/docs/${name}.html`;
            const active = name === current ? ' class="active" aria-current="page"' : '';
            return `<li><a href="${href}"${active}>${escapeHtml(label)}</a></li>`;
        }).join('\n');
        return `<div class="section-title">${escapeHtml(title)}</div>\n<ul>\n${items}\n</ul>`;
    }).join('\n');
    const github = DOCS_ON_GITHUB
        .map(([label, href]) => `<li><a href="${href}" rel="noopener">${escapeHtml(label)} ↗</a></li>`)
        .join('\n');
    return `<aside class="docs-sidebar">
  <nav class="docs-nav" aria-label="Documentation">
${sections}
<div class="section-title">On GitHub</div>
<ul>
${github}
</ul>
  </nav>
</aside>`;
};

const docsPage = ({ name, title, bodyHtml, source }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} · AKIOS documentation</title>
  <meta name="description" content="${escapeHtml(title)}: AKIOS ${version} documentation.">
  <link rel="canonical" href="{{canonical}}">
  <link rel="stylesheet" href="{{root}}/assets/css/styles.css">
  <link rel="icon" href="{{root}}/assets/img/favicon.svg" type="image/svg+xml">
</head>
<body>
<!-- {{header}} -->
<div class="page">
  <div class="docs-wrapper">
${docsSidebar(name)}
    <main class="docs-content" id="main-content">
${bodyHtml}
      <p class="doc-source">This page is a copy of <a href="${REPO}/blob/main/${source}" rel="noopener">${escapeHtml(source)}</a> in the akios repository.</p>
    </main>
  </div>
</div>
<!-- {{footer}} -->
</body>
</html>
`;

const renderDocs = () => {
    const docsDir = path.join(SRC_DIR, 'docs');
    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
    const inNav = DOCS_NAV.flatMap(([, pages]) => pages.map(([name]) => name));
    for (const name of files) if (!inNav.includes(name)) fail(`site/docs/${name}.md is not in DOCS_NAV`);
    for (const name of inNav) if (!files.includes(name)) fail(`DOCS_NAV lists ${name}, but site/docs/${name}.md does not exist`);

    const labels = Object.fromEntries(DOCS_NAV.flatMap(([, pages]) => pages));
    return inNav.map((name) => {
        const { meta, body } = frontmatterOf(readFile(path.join(docsDir, `${name}.md`)));
        if (!meta.source) fail(`site/docs/${name}.md has no "source:" in its front matter`);
        const headings = [];
        const bodyHtml = renderMarkdown(body, { slugger: makeSlugger(), headings });
        const h1 = headings.find((h) => h.depth === 1);
        if (!h1) fail(`site/docs/${name}.md has no title`);
        return { name, label: labels[name], title: h1.text, bodyHtml, source: meta.source, headings };
    });
};

// --- Build ---

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
});

const build = async () => {
    await fs.emptyDir(DIST_DIR);

    const docs = renderDocs();
    for (const doc of docs) {
        const relPath = `docs/${doc.name}.html`;
        await writePage(relPath, docsPage(doc));
    }

    for (const file of walk(SRC_DIR)) {
        const relPath = path.relative(SRC_DIR, file).split(path.sep).join('/');
        if (relPath.startsWith('docs/') && relPath.endsWith('.md')) continue;
        if (relPath.endsWith('.md') || relPath.endsWith('.mdx')) fail(`${relPath}: Markdown outside site/docs/ is not built`);
        if (relPath.endsWith('.html')) {
            await buildHtmlPage(relPath);
        } else if (path.basename(relPath) !== '.DS_Store') {
            await fs.copy(file, path.join(DIST_DIR, relPath));
        }
    }

    // Search index: the title and the headings of each documentation page.
    const index = docs.flatMap((doc) => {
        const url = doc.name === 'index' ? '/docs/' : `/docs/${doc.name}.html`;
        return doc.headings
            .filter((h) => h.depth <= 3)
            .map((h) => ({
                title: h.depth === 1 ? doc.label : h.text,
                section: doc.label,
                url: h.depth === 1 ? url : `${url}#${h.id}`,
            }));
    });
    await fs.outputFile(path.join(DIST_DIR, 'assets', 'search-index.json'), JSON.stringify(index));

    const urls = built
        .filter((relPath) => !NOT_IN_SITEMAP.has(relPath))
        .map(canonicalPathFor)
        .sort();
    const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')
        + '\n</urlset>\n';
    await fs.outputFile(path.join(DIST_DIR, 'sitemap.xml'), sitemap);

    console.log(`Built ${built.length} pages (${docs.length} documentation pages) for AKIOS ${version} into ${DIST_DIR}/.`);
};

build().catch((error) => {
    console.error(error);
    process.exit(1);
});
