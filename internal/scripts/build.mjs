import fs from 'fs-extra';
import path from 'path';
import { marked } from 'marked';

// Config
const SRC_DIR = 'site';
const DIST_DIR = 'dist';
const PARTIALS_DIR = 'partials';
const LOCALES_DIR = 'internal/i18n/modules';

// Load Version
let version = '1.0.0';
try {
    const versionFile = JSON.parse(fs.readFileSync('version.json', 'utf-8'));
    version = versionFile.version || '1.0.0';
} catch (error) {
    console.warn('Warning: version.json not found, using default version');
}

// Load Locales
const locales = { en: {}, fr: {} };

try {
    if (fs.existsSync(LOCALES_DIR)) {
        const localeFiles = fs.readdirSync(LOCALES_DIR).filter(file => file.endsWith('.json'));
        for (const file of localeFiles) {
            const filePath = path.join(LOCALES_DIR, file);
            const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (fileContent.en) Object.assign(locales.en, fileContent.en);
            if (fileContent.fr) Object.assign(locales.fr, fileContent.fr);
        }
    } else {
        console.error(`Locales directory not found: ${LOCALES_DIR}`);
        process.exit(1);
    }
} catch (error) {
    console.error('Error loading locales:', error);
    process.exit(1);
}

// Helper: Read file content
const readFile = (filePath) => fs.readFileSync(filePath, 'utf-8');

// Helper: Calculate relative prefix for assets (e.g. "../")
const getRootPrefixFromTarget = (targetRelPath) => {
    const depth = targetRelPath.split(path.sep).length - 1;
    return depth === 0 ? '.' : '../'.repeat(depth);
};

// Helper: pretty path (adds folder/index.html) in addition to original
const prettyPaths = (relPath) => {
    if (!relPath.endsWith('.html')) return [];
    const base = path.basename(relPath, '.html');
    if (base === 'index') return [];
    const dir = path.dirname(relPath);
    const pretty = path.join(dir === '.' ? '' : dir, base, 'index.html');
    return [pretty];
};

// Helper: Get Locale from path
const getLocale = (filePath) => {
    const relPath = path.relative(SRC_DIR, filePath);
    // If path starts with 'fr/' or is 'fr', it's French.
    if (relPath.startsWith('fr/') || relPath === 'fr') return 'fr';
    return 'en'; // Default
};

// Helper: Translate key
const t = (key, locale) => {
    const keys = key.split('.');
    let val = locales[locale];
    for (const k of keys) {
        val = val?.[k];
    }
    return val !== undefined ? val : key;
};

// Helper: Inject i18n strings into content
const injectI18n = (content, locale) => {
    return content.replace(/{{i18n\.([\w\.]+)}}/g, (_, key) => t(key, locale));
};

// Build Function
const build = async () => {
    console.log('Building website...');

    // Load partials
    const headerTemplate = readFile(path.join(PARTIALS_DIR, 'header.html'));
    const footerTemplate = readFile(path.join(PARTIALS_DIR, 'footer.html'));

    // Clean dist
    await fs.emptyDir(DIST_DIR);

    const multiLocalePages = {
        'index.html': ['index.html', path.join('fr', 'index.html')],
        'community.html': ['community.html', path.join('fr', 'community.html')],
        'legal.html': ['legal.html', path.join('fr', 'legal.html')],
        'terms.html': ['terms.html', path.join('fr', 'terms.html')],
        'privacy.html': ['privacy.html', path.join('fr', 'privacy.html')],
        'cookies.html': ['cookies.html', path.join('fr', 'cookies.html')],
        'disclosure.html': ['disclosure.html', path.join('fr', 'disclosure.html')],
        [path.join('blog', 'index.html')]: [
            path.join('blog', 'index.html'),
            path.join('fr', 'blog', 'index.html')
        ]
    };

    const skipHtml = new Set([
        path.join('fr', 'index.html'),
        path.join('fr', 'community.html'),
        path.join('fr', 'legal.html'),
        path.join('fr', 'terms.html'),
        path.join('fr', 'privacy.html'),
        path.join('fr', 'cookies.html'),
        path.join('fr', 'disclosure.html'),
        path.join('fr', 'blog', 'index.html')
    ]);

    // Helper to process a file
    const processFile = async (filePath) => {
        const relPath = path.relative(SRC_DIR, filePath);
        const distPath = path.join(DIST_DIR, relPath);
        const ext = path.extname(filePath);
        const locale = getLocale(filePath);

        if (ext === '.html' && skipHtml.has(relPath)) {
            return;
        }

        if (ext === '.html' && multiLocalePages[relPath]) {
            const rawContent = readFile(filePath);

            for (const targetRel of multiLocalePages[relPath]) {
                const targetLocale = targetRel.startsWith('fr/') ? 'fr' : 'en';
                const header = injectI18n(headerTemplate, targetLocale);
                const footer = injectI18n(footerTemplate, targetLocale);

                const targets = [targetRel, ...prettyPaths(targetRel)];
                for (const finalRel of targets) {
                    const prefix = getRootPrefixFromTarget(finalRel);
                    const rootReplacement = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;

                    let content = rawContent
                        .replace(/<html lang="[^"]+">/i, `<html lang="${targetLocale}">`)
                        .replace('<!-- {{header}} -->', header)
                        .replace('<!-- {{footer}} -->', footer)
                        .replace(/{{root}}/g, rootReplacement)
                        .replace(/{{version}}/g, version);

                    const canonical = targetLocale === 'fr' ? 'https://akios.ai/fr/' : 'https://akios.ai/';
                    content = content.replace(/{{canonical}}/g, canonical);

                    content = injectI18n(content, targetLocale);

                    const targetDistPath = path.join(DIST_DIR, finalRel);
                    await fs.outputFile(targetDistPath, content);
                    console.log(`Built HTML (${targetLocale}): ${targetDistPath}`);
                }
            }

        } else if (ext === '.html') {
            const header = injectI18n(headerTemplate, locale);
            const footer = injectI18n(footerTemplate, locale);

            const targets = [relPath, ...prettyPaths(relPath)];
            const rawContent = readFile(filePath);

            for (const finalRel of targets) {
                const prefix = getRootPrefixFromTarget(finalRel);
                const rootReplacement = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;

                let content = rawContent
                    .replace(/<html lang="[^"]+">/i, `<html lang="${locale}">`)
                    .replace('<!-- {{header}} -->', header)
                    .replace('<!-- {{footer}} -->', footer)
                    .replace(/{{root}}/g, rootReplacement)
                    .replace(/{{version}}/g, version);
                
                content = injectI18n(content, locale);

                const targetDistPath = path.join(DIST_DIR, finalRel);
                await fs.outputFile(targetDistPath, content);
                console.log(`Built HTML (${locale}): ${targetDistPath}`);
            }

        } else if (ext === '.md' || ext === '.mdx') {
            const header = injectI18n(headerTemplate, locale);
            const footer = injectI18n(footerTemplate, locale);

            const rawContent = readFile(filePath);
            
            // Strip YAML frontmatter
            let contentWithoutFrontmatter = rawContent;
            if (rawContent.startsWith('---')) {
                const endIndex = rawContent.indexOf('---', 3);
                if (endIndex !== -1) {
                    contentWithoutFrontmatter = rawContent.substring(endIndex + 3).trim();
                }
            }
            
            const htmlBody = marked.parse(contentWithoutFrontmatter);

            const isDocs = relPath.startsWith('docs/') || relPath.startsWith('fr/docs/');
            const isBlog = relPath.startsWith('blog/') || relPath.startsWith('fr/blog/');

            if (isDocs) {
                const docsSidebar = `
            <aside class="docs-sidebar">
                <nav class="docs-nav">
                    <div class="section-title">${t('sidebar.start_here', locale)}</div>
                    <ul>
                        <li><a href="{{ROOT}}/docs/index.html">${t('sidebar.overview', locale)}</a></li>
                        <li><a href="{{ROOT}}/docs/installation.html">${t('sidebar.installation', locale)}</a></li>
                        <li><a href="{{ROOT}}/docs/quickstart.html">${t('sidebar.quickstart', locale)}</a></li>
                    </ul>

                    <div class="section-title">${t('sidebar.core', locale)}</div>
                    <ul>
                        <li><a href="{{ROOT}}/docs/concepts.html">${t('sidebar.concepts', locale)}</a></li>
                        <li><a href="{{ROOT}}/docs/security.html">${t('sidebar.security_model', locale)}</a></li>
                        <li><a href="{{ROOT}}/docs/use-cases.html">${t('sidebar.use_cases', locale)}</a></li>
                    </ul>

                    <div class="section-title">${t('sidebar.reference', locale)}</div>
                    <ul>
                        <li><a href="{{ROOT}}/docs/config-reference.html">${t('sidebar.config_reference', locale)}</a></li>
                        <li><a href="{{ROOT}}/docs/policy-schema.html">${t('sidebar.policy_schema', locale)}</a></li>
                        <li><a href="{{ROOT}}/docs/cli-reference.html">CLI Reference</a></li>
                        <li><a href="{{ROOT}}/docs/debugging.html">${t('sidebar.debugging', locale)}</a></li>
                        <li><a href="{{ROOT}}/docs/api-reference.html">API Reference</a></li>
                        <li><a href="{{ROOT}}/docs/faq-glossary.html">FAQ & Glossary</a></li>
                    </ul>

                    <div class="section-title">Integration</div>
                    <ul>
                        <li><a href="{{ROOT}}/docs/integration-api.html">API Integration</a></li>
                        <li><a href="{{ROOT}}/docs/integration-document-processing.html">Document Processing</a></li>
                    </ul>

                    <div class="section-title">Advanced</div>
                    <ul>
                        <li><a href="{{ROOT}}/docs/best-practices.html">Best Practices</a></li>
                        <li><a href="{{ROOT}}/docs/deployment.html">Deployment</a></li>
                        <li><a href="{{ROOT}}/docs/migration-guide.html">Migration Guide</a></li>
                    </ul>
                </nav>
            </aside>`;

                let pageContent = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t('nav.docs', locale)}</title>
    <link rel="stylesheet" href="{{ROOT}}/assets/css/styles.css">
</head>
<body>
    ${header.replace(/{{root}}/g, '{{ROOT}}')}
    
    <div class="page">
        <div class="docs-wrapper">
            ${docsSidebar}
            
            <main class="docs-content">
                ${htmlBody}
            </main>
        </div>
    </div>

    ${footer.replace(/{{root}}/g, '{{ROOT}}')}

    <script>
        (function() {
            const path = window.location.pathname;
            const sidebarLinks = document.querySelectorAll('.docs-nav a');
            
            sidebarLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (path.endsWith(href)) {
                    link.classList.add('active');
                }
            });
        })();
    </script>
</body>
</html>`;

                const baseRel = relPath.replace(ext, '.html');
                const targets = [baseRel, ...prettyPaths(baseRel)];
                for (const finalRel of targets) {
                    const prefix = getRootPrefixFromTarget(finalRel);
                    const rootRepl = (prefix.endsWith('/') ? prefix.slice(0, -1) : prefix);
                    const adjusted = pageContent.replace(/{{ROOT}}/g, rootRepl).replace(/{{version}}/g, version);
                    const htmlDistPath = path.join(DIST_DIR, finalRel);
                    await fs.outputFile(htmlDistPath, adjusted);
                    console.log(`Built MDX docs -> HTML (${locale}): ${htmlDistPath}`);
                }
            } else if (isBlog) {
                let pageContent = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AKIOS — ${t('nav.blog', locale)}</title>
    <link rel="stylesheet" href="{{ROOT}}/assets/css/styles.css">
    <link rel="icon" href="{{ROOT}}/assets/img/favicon.svg" type="image/svg+xml">
</head>
<body>
    ${header.replace(/{{root}}/g, '{{ROOT}}')}
    
    <article class="section">
        <div class="page">
            <div class="blog-post-wrapper">
                <div class="blog-post-main">
                    ${htmlBody}
                </div>
                <!-- TOC DISABLED - Commented out for future use
                <aside class="blog-toc">
                    <div class="blog-toc-sticky">
                        <h4>${t('blog_post.table_of_contents', locale)}</h4>
                        <nav class="toc-nav"></nav>
                    </div>
                </aside>
                -->
            </div>
        </div>
    </article>

    ${footer.replace(/{{root}}/g, '{{ROOT}}')}
    
    <!-- TOC DISABLED - Commented out for future use
    <script>
        // Generate TOC from headings
        (function() {
            const content = document.querySelector('.blog-post-main .post-content');
            const tocNav = document.querySelector('.toc-nav');
            if (!content || !tocNav) return;
            
            const headings = content.querySelectorAll('h2');
            if (headings.length === 0) {
                document.querySelector('.blog-toc').style.display = 'none';
                return;
            }
            
            const tocList = document.createElement('ul');
            headings.forEach((heading, index) => {
                const id = 'heading-' + index;
                heading.id = id;
                
                const li = document.createElement('li');
                li.className = heading.tagName.toLowerCase();
                const a = document.createElement('a');
                a.href = '#' + id;
                a.textContent = heading.textContent;
                a.onclick = (e) => {
                    e.preventDefault();
                    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                };
                li.appendChild(a);
                tocList.appendChild(li);
            });
            
            tocNav.appendChild(tocList);
            
            // Highlight current section on scroll
            let currentActive = null;
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        const link = tocNav.querySelector('a[href="#' + id + '"]');
                        if (link) {
                            if (currentActive) currentActive.classList.remove('active');
                            link.classList.add('active');
                            currentActive = link;
                        }
                    }
                });
            }, { rootMargin: '0px 0px -80% 0px' });
            
            headings.forEach(heading => observer.observe(heading));
        })();
    </script>
    -->
</body>
</html>`;

                const baseRel = relPath.replace(ext, '.html');
                const targets = [baseRel, ...prettyPaths(baseRel)];
                for (const finalRel of targets) {
                    const prefix = getRootPrefixFromTarget(finalRel);
                    const rootRepl = (prefix.endsWith('/') ? prefix.slice(0, -1) : prefix);
                    const adjusted = pageContent.replace(/{{ROOT}}/g, rootRepl).replace(/{{version}}/g, version);
                    const htmlDistPath = path.join(DIST_DIR, finalRel);
                    await fs.outputFile(htmlDistPath, adjusted);
                    console.log(`Built MDX blog -> HTML (${locale}): ${htmlDistPath}`);
                }
            } else {
                let pageContent = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t('nav.docs', locale)}</title>
    <link rel="stylesheet" href="{{ROOT}}/assets/css/styles.css">
</head>
<body>
    ${header.replace(/{{root}}/g, '{{ROOT}}')}
    
    <div class="page">
        ${htmlBody}
    </div>

    ${footer.replace(/{{root}}/g, '{{ROOT}}')}
</body>
</html>`;

                const baseRel = relPath.replace(ext, '.html');
                const targets = [baseRel, ...prettyPaths(baseRel)];
                for (const finalRel of targets) {
                    const prefix = getRootPrefixFromTarget(finalRel);
                    const rootRepl = (prefix.endsWith('/') ? prefix.slice(0, -1) : prefix);
                    const adjusted = pageContent.replace(/{{ROOT}}/g, rootRepl).replace(/{{version}}/g, version);
                    const htmlDistPath = path.join(DIST_DIR, finalRel);
                    await fs.outputFile(htmlDistPath, adjusted);
                    console.log(`Built MDX page -> HTML (${locale}): ${htmlDistPath}`);
                }
            }

        } else {
            // Copy assets
            await fs.copy(filePath, distPath);
        }
    };

    // Walk directory
    const walk = async (dir) => {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);
            if (stat.isDirectory()) {
                await walk(filePath);
            } else {
                await processFile(filePath);
            }
        }
    };

    await walk(SRC_DIR);
    console.log('Done.');
};

build().catch(err => console.error(err));
