// Checks the built site in dist/ (run `npm run build` first).
//
// - every internal link, image, stylesheet and script points to a file of dist/,
//   and every #fragment to an id of the target page (links to https://akios.ai/...
//   are internal too);
// - no page loads a script, a stylesheet, an image or a frame from another host;
// - every e-mail link is to hello@akios.ai;
// - every URL of sitemap.xml exists.
//
// Prints the external links it did not check, by host. Exits with code 1 on any problem.

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const DIST = 'dist';
const SITE_HOST = 'akios.ai';
const CONTACT = 'hello@akios.ai';

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('check-links: dist/index.html not found; run "npm run build" first');
    process.exit(2);
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
});

const pages = walk(DIST).filter((f) => f.endsWith('.html'));
const docs = new Map(); // dist-relative path -> { document, ids }
for (const file of pages) {
    const rel = path.relative(DIST, file).split(path.sep).join('/');
    const { document } = new JSDOM(fs.readFileSync(file, 'utf-8')).window;
    const ids = new Set([...document.querySelectorAll('[id]')].map((el) => el.id));
    for (const a of document.querySelectorAll('a[name]')) ids.add(a.getAttribute('name'));
    docs.set(rel, { document, ids });
}

// A URL path of the site -> the dist-relative file that serves it, or null.
const fileFor = (urlPath) => {
    let rel = decodeURIComponent(urlPath).replace(/^\/+/, '');
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const full = path.join(DIST, rel);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
        rel = path.posix.join(rel, 'index.html');
    }
    return fs.existsSync(path.join(DIST, rel)) ? rel : null;
};

const problems = [];
const external = new Map(); // host -> count
let checked = 0;

const checkUrl = (pageRel, raw, kind) => {
    if (raw === undefined || raw === null) return;
    const value = raw.trim();
    if (value === '' || value.startsWith('javascript:') || value.startsWith('data:')) return;
    if (value.startsWith('mailto:')) {
        const address = value.slice(7).split('?')[0];
        if (address !== CONTACT) problems.push(`${pageRel}: e-mail link to ${address}`);
        return;
    }
    const pageUrl = new URL('https://' + SITE_HOST + '/' + pageRel);
    let url;
    try {
        url = new URL(value, pageUrl);
    } catch {
        problems.push(`${pageRel}: invalid URL ${value}`);
        return;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
    if (url.hostname !== SITE_HOST && url.hostname !== 'www.' + SITE_HOST) {
        if (kind !== 'link') problems.push(`${pageRel}: loads a ${kind} from another host: ${value}`);
        external.set(url.hostname, (external.get(url.hostname) || 0) + 1);
        return;
    }
    checked += 1;
    const target = fileFor(url.pathname);
    if (!target) {
        problems.push(`${pageRel}: broken ${kind} ${value}`);
        return;
    }
    const fragment = decodeURIComponent(url.hash.slice(1));
    if (fragment && target.endsWith('.html') && !docs.get(target).ids.has(fragment)) {
        problems.push(`${pageRel}: no #${fragment} in ${target} (${value})`);
    }
};

for (const [rel, { document }] of docs) {
    for (const a of document.querySelectorAll('a[href]')) checkUrl(rel, a.getAttribute('href'), 'link');
    for (const l of document.querySelectorAll('link[href]')) {
        const relAttr = (l.getAttribute('rel') || '').toLowerCase();
        checkUrl(rel, l.getAttribute('href'), relAttr === 'canonical' ? 'link' : 'resource');
    }
    for (const el of document.querySelectorAll('img[src], script[src], iframe[src], source[src], video[src], audio[src]')) {
        checkUrl(rel, el.getAttribute('src'), el.tagName.toLowerCase());
    }
    const refresh = document.querySelector('meta[http-equiv="refresh" i]');
    if (refresh) {
        const m = (refresh.getAttribute('content') || '').match(/url=(.+)$/i);
        if (m) checkUrl(rel, m[1], 'link');
    }
}

// sitemap.xml and robots.txt
const sitemap = fs.existsSync(path.join(DIST, 'sitemap.xml')) ? fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf-8') : '';
if (!sitemap) problems.push('dist/sitemap.xml is missing');
for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = new URL(loc);
    if (url.hostname !== SITE_HOST || !fileFor(url.pathname)) problems.push(`sitemap.xml: ${loc} does not exist`);
    checked += 1;
}
const robots = fs.existsSync(path.join(DIST, 'robots.txt')) ? fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf-8') : '';
if (!/^Sitemap: https:\/\/akios\.ai\/sitemap\.xml$/m.test(robots)) problems.push('robots.txt does not name https://akios.ai/sitemap.xml');
if (!fs.existsSync(path.join(DIST, '404.html'))) problems.push('dist/404.html is missing');

console.log(`check-links: ${pages.length} pages, ${checked} internal links and sitemap entries checked.`);
console.log('External links, not checked: ' + [...external].sort().map(([h, n]) => `${h} (${n})`).join(', '));
if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n` + problems.map((p) => '  ' + p).join('\n'));
    process.exit(1);
}
console.log('No broken internal link, no third-party resource, no other e-mail address.');
