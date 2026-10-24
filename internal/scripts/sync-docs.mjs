// Copies the AKIOS documentation from a checkout of the akios repository into
// the site, with links rewritten for the site. The copied files are not edited
// by hand: change them in the akios repository, then run this script again.
//
//   node internal/scripts/sync-docs.mjs <path to an akios checkout>
//
// Writes site/docs/*.md (the documentation pages), content/*.md (documents
// included in other pages) and content/readme/*.md (sections of README.md
// shown on the home page), and content/source.json (the git tree they came
// from). Fails when a relative link points to a file that does not exist.

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const REPO = 'https://github.com/akios-ai/akios';
const src = process.argv[2];
if (!src || !fs.existsSync(path.join(src, 'docs', 'threat-model.md'))) {
    console.error('usage: node internal/scripts/sync-docs.mjs <path to an akios checkout>');
    process.exit(2);
}

// Repository file -> where the site renders it.
const RENDERED = {
    'docs/README.md': { out: 'site/docs/index.md', url: '/docs/' },
    'GETTING_STARTED.md': { out: 'site/docs/getting-started.md', url: '/docs/getting-started.html' },
    'docs/why-containment.md': { out: 'site/docs/why-containment.md', url: '/docs/why-containment.html' },
    'docs/threat-model.md': { out: 'site/docs/threat-model.md', url: '/docs/threat-model.html' },
    'docs/spec/policy-v0.md': { out: 'site/docs/policy-v0.md', url: '/docs/policy-v0.html' },
    'docs/spec/ledger-v0.md': { out: 'site/docs/ledger-v0.md', url: '/docs/ledger-v0.html' },
    'docs/cli-reference.md': { out: 'site/docs/cli-reference.md', url: '/docs/cli-reference.html' },
    'docs/configuration.md': { out: 'site/docs/configuration.md', url: '/docs/configuration.html' },
    'TROUBLESHOOTING.md': { out: 'site/docs/troubleshooting.md', url: '/docs/troubleshooting.html' },
    'docs/migration-1x-to-2.md': { out: 'site/docs/migration-1x-to-2.md', url: '/docs/migration-1x-to-2.html' },
    'LEGAL.md': { out: 'content/LEGAL.md', url: '/legal.html', plain: true },
    'TRADEMARKS.md': { out: 'content/TRADEMARKS.md', url: '/legal.html#akios-trademark-guidelines', plain: true },
    'SECURITY.md': { out: 'content/SECURITY.md', url: '/disclosure.html' },
    'SUPPORT.md': { out: 'content/SUPPORT.md', url: '/support.html' },
};

// Sections of README.md shown on the home page, by their "## " heading.
const README_SECTIONS = {
    'Three minutes': 'content/readme/three-minutes.md',
    'The policy flow': 'content/readme/policy-flow.md',
    'What is enforced on Linux': 'content/readme/linux.md',
    'What is enforced on macOS': 'content/readme/macos.md',
    'The evidence': 'content/readme/evidence.md',
    'Formal model': 'content/readme/formal-model.md',
    'Coming from 1.x': 'content/readme/from-1x.md',
    'License': 'content/readme/license.md',
};

const problems = [];

const siteUrlFor = (repoPath, fragment) => {
    const page = RENDERED[repoPath];
    if (!page) return null;
    if (fragment && page.url.includes('#')) return page.url.split('#')[0] + '#' + fragment;
    return page.url + (fragment ? '#' + fragment : '');
};

const githubUrlFor = (repoPath, fragment) => {
    const abs = path.join(src, repoPath);
    const isDir = repoPath.endsWith('/') || (fs.existsSync(abs) && fs.statSync(abs).isDirectory());
    const clean = repoPath.replace(/\/$/, '');
    return `${REPO}/${isDir ? 'tree' : 'blob'}/main/${clean}${fragment ? '#' + fragment : ''}`;
};

const rewriteTarget = (target, fromFile) => {
    if (target.startsWith('#') || target.startsWith('mailto:')) return target;
    const [base, fragment] = target.split('#');
    const gh = base.match(/^https:\/\/github\.com\/akios-ai\/akios\/(?:blob|tree)\/main\/(.+)$/);
    if (gh) {
        return siteUrlFor(gh[1], fragment) || target;
    }
    if (/^[a-z]+:/i.test(base)) return target;
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), base));
    if (resolved.startsWith('..')) {
        problems.push(`${fromFile}: link outside the repository: ${target}`);
        return target;
    }
    if (!fs.existsSync(path.join(src, resolved))) {
        problems.push(`${fromFile}: link to a missing file: ${target}`);
    }
    const keepSlash = base.endsWith('/') ? '/' : '';
    return siteUrlFor(resolved, fragment) || githubUrlFor(resolved + keepSlash, fragment);
};

// Rewrites inline links outside code (fenced blocks and code spans).
const rewriteLinks = (text, fromFile) => {
    const parts = text.split(/(^```[^\n]*\n[\s\S]*?^```[^\n]*$)/m);
    return parts.map((part, i) => {
        if (i % 2 === 1) return part; // fenced code block
        return part.split(/(`+[^`\n]*?`+)/).map((chunk, j) => {
            if (j % 2 === 1) return chunk; // code span
            return chunk.replace(/\]\(([^)\s]+)\)/g, (_, target) => `](${rewriteTarget(target, fromFile)})`);
        }).join('');
    }).join('');
};

// Pictographs and their joiners (not ©, ® or ™), removed from the plain
// documents: legal text rendered without decoration; the words are unchanged.
const stripPictographs = (text) =>
    text.replace(/(?:(?![\u00A9\u00AE\u2122])[\p{Extended_Pictographic}\p{Regional_Indicator}\u{FE0F}\u{200D}])+[ \t]*/gu, '');

const frontmatter = (repoPath) =>
    `---\nsource: ${repoPath}\nnote: copied from the akios repository by internal/scripts/sync-docs.mjs; edit the source, not this file\n---\n\n`;

const write = (out, body) => {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, body);
    console.log(`wrote ${out}`);
};

for (const [repoPath, page] of Object.entries(RENDERED)) {
    let text = fs.readFileSync(path.join(src, repoPath), 'utf-8');
    text = rewriteLinks(text, repoPath);
    if (page.plain) text = stripPictographs(text);
    write(page.out, frontmatter(repoPath) + text.trimEnd() + '\n');
}

// README sections.
const readme = rewriteLinks(fs.readFileSync(path.join(src, 'README.md'), 'utf-8'), 'README.md');
const sections = {};
let current = null;
for (const line of readme.split('\n')) {
    const h = line.match(/^## (.+)$/);
    if (h) { current = h[1].trim(); sections[current] = []; continue; }
    if (current) sections[current].push(line);
}
for (const [heading, out] of Object.entries(README_SECTIONS)) {
    if (!sections[heading]) {
        problems.push(`README.md: no section "## ${heading}"`);
        continue;
    }
    write(out, frontmatter(`README.md, section "${heading}"`) + sections[heading].join('\n').trim() + '\n');
}

let tree = null;
try {
    tree = execFileSync('git', ['-C', src, 'rev-parse', 'HEAD^{tree}'], { encoding: 'utf-8' }).trim();
} catch {
    problems.push('the source is not a git checkout: its tree is not recorded');
}
write('content/source.json', JSON.stringify({ repository: REPO, tree }, null, 2) + '\n');

if (problems.length) {
    console.error('\n' + problems.join('\n'));
    process.exit(1);
}
