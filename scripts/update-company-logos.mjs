import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { companies } from '../src/data/companies.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetDir = resolve(root, 'src/assets/company-logos');
const manifestPath = resolve(root, 'src/data/company-logos.js');
const force = process.argv.includes('--force');
const timeoutMs = 12_000;
const maxBytes = 1_500_000;
const atsHosts = /(?:greenhouse\.io|lever\.co|ashbyhq\.com|workdayjobs\.com|myworkdayjobs\.com|smartrecruiters\.com|workable\.com|bamboohr\.com|teamtailor\.com|jobs\.deel\.com)$/i;
const logoDomains = {
  'cambridge mobile telematics': 'cmtelematics.com',
  'dept': 'deptagency.com',
  'orion innovation': 'orioninc.com',
  'xebia': 'xebia.com'
};
const headers = {
  accept: 'text/html,application/xhtml+xml,image/avif,image/webp,image/png,image/svg+xml,image/*;q=.8,*/*;q=.5',
  'user-agent': 'Mozilla/5.0 (compatible; QA-Career-Hub-Logo-Cache/1.0)'
};

const companyKey = (name) => String(name)
  .replace(/\.US$/i, '')
  .replace(/\s*\/\s*Gen Digital$/i, '')
  .trim()
  .toLowerCase();
const slug = (name) => companyKey(name)
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '') || 'company';
const attributes = (tag) => Object.fromEntries(
  [...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map((match) => [match[1].toLowerCase(), match[3]])
);
const absoluteUrl = (value, base) => {
  try { return new URL(value, base).href; } catch { return null; }
};
const extensionFor = (contentType, url) => {
  if (/svg/i.test(contentType)) return '.svg';
  if (/webp/i.test(contentType)) return '.webp';
  if (/jpe?g/i.test(contentType)) return '.jpg';
  if (/x-icon|vnd\.microsoft\.icon/i.test(contentType)) return '.ico';
  if (/png/i.test(contentType)) return '.png';
  const extension = extname(new URL(url).pathname).toLowerCase();
  return ['.svg', '.webp', '.jpg', '.jpeg', '.png', '.ico'].includes(extension) ? extension.replace('.jpeg', '.jpg') : '.png';
};
const extensionFromBytes = (bytes, contentType, url) => {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return '.png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return '.jpg';
  if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) return '.ico';
  if (String.fromCharCode(...bytes.slice(0, 12)).includes('WEBP')) return '.webp';
  if (new TextDecoder().decode(bytes.slice(0, 256)).includes('<svg')) return '.svg';
  return contentType.startsWith('image/') ? extensionFor(contentType, url) : null;
};

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function logoCandidates(company) {
  const career = new URL(company.careerUrl);
  const overrideDomain = logoDomains[companyKey(company.name)];
  if (overrideDomain) {
    return [
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(overrideDomain)}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${encodeURIComponent(overrideDomain)}.ico`
    ];
  }
  if (!atsHosts.test(career.hostname)) {
    return [
      `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(career.origin)}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${encodeURIComponent(career.hostname)}.ico`
    ];
  }

  try {
    const response = await fetchWithTimeout(company.careerUrl);
    if (!response.ok) throw new Error(`${response.status}`);
    const html = await response.text();
    const images = [];
    for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
      const attrs = attributes(tag);
      const name = String(attrs.property || attrs.name || '').toLowerCase();
      if ((name === 'og:image' || name === 'twitter:image') && attrs.content) images.push(absoluteUrl(attrs.content, response.url));
    }
    return [...new Set(images.filter(Boolean))];
  } catch {
    return [];
  }
}

async function downloadLogo(company, existingFiles) {
  const prefix = `${slug(company.name)}.`;
  const existing = existingFiles.find((file) => file.startsWith(prefix));
  if (existing && !force) return existing;

  for (const candidate of await logoCandidates(company)) {
    try {
      const response = await fetchWithTimeout(candidate);
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') || '';
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length || bytes.length > maxBytes) continue;
      const extension = extensionFromBytes(bytes, contentType, response.url);
      if (!extension) continue;
      const file = `${slug(company.name)}${extension}`;
      await writeFile(resolve(assetDir, file), bytes);
      return file;
    } catch {
      // A missing logo must never stop vacancy updates.
    }
  }
  return existing || null;
}

await mkdir(assetDir, { recursive: true });
const existingFiles = await readdir(assetDir);
const results = new Map();
let cursor = 0;
const workers = Array.from({ length: 8 }, async () => {
  while (cursor < companies.length) {
    const company = companies[cursor++];
    const file = await downloadLogo(company, existingFiles);
    if (file) results.set(companyKey(company.name), `./src/assets/company-logos/${file}`);
  }
});
await Promise.all(workers);

const entries = [...results.entries()].sort(([a], [b]) => a.localeCompare(b));
const source = `// Generated by npm run update:logos.\nexport const companyLogos = ${JSON.stringify(Object.fromEntries(entries), null, 2)};\n`;
await writeFile(manifestPath, source);
console.log(`Company logos ready: ${entries.length}/${companies.length}`);
