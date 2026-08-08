import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { companies } from '../src/data/companies.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const companiesPath=resolve(root,'src/data/companies.js');
const shouldWrite=process.argv.includes('--write');
const maxNew=12;
const rolePattern=/\b(?:qa|quality assurance|quality engineer|test engineer|test automation|automation test|sdet|aqa)\b/i;
const agencyPattern=/\b(?:recruit(?:ing|ment|er)?|staffing|talent solutions?|headhunt(?:er|ing)?|executive search)\b/i;
const careerPattern=/\b(?:careers?|jobs?|vacanc(?:y|ies)|positions?|open roles?|opportunities|join (?:us|the team))\b/i;
const searches=[
  ['QA Engineer','European Union',false],
  ['AQA Engineer','European Union',false],
  ['SDET','European Union',false],
  ['QA Engineer','United Kingdom',false],
  ['AQA Engineer','United Kingdom',false],
  ['SDET','United Kingdom',false],
  ['QA Engineer','Cyprus',false],
  ['AQA Engineer','Cyprus',false],
  ['SDET','Cyprus',false],
  ['QA Engineer','Worldwide',true],
  ['AQA Engineer','Worldwide',true],
  ['SDET','Worldwide',true]
];

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const decode=value=>String(value||'')
  .replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
  .replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
const text=html=>decode(String(html||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')).trim();
const companyKey=name=>String(name||'').replace(/\.US$/,'').replace(/\s*\/\s*Gen Digital$/,'').trim().toLowerCase();

function publicUrl(value,base) {
  try {
    const url=new URL(decode(value),base);
    if(!['http:','https:'].includes(url.protocol)) return null;
    const host=url.hostname.toLowerCase();
    if(host==='localhost'||host.endsWith('.local')||/^(?:127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host)) return null;
    url.hash='';
    return url.href;
  } catch { return null; }
}

async function fetchText(url,{timeout=18000}={}) {
  const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(timeout),headers:{
    'user-agent':'Mozilla/5.0 (compatible; QA-Career-Hub/1.0; +daily-company-discovery)',
    accept:'text/html,application/xhtml+xml'
  }});
  if(!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const body=await response.text();
  if(body.length>4_000_000) throw new Error('response too large');
  return {html:body,url:response.url};
}

function parseCards(html) {
  const rows=[];
  for(const fragment of html.split(/<li\b[^>]*>/i)) {
    if(!/job-search-card/i.test(fragment)) continue;
    const jobUrl=publicUrl(fragment.match(/base-card__full-link[^>]+href=["']([^"']+)/i)?.[1]);
    const title=text(fragment.match(/base-search-card__title[^>]*>([\s\S]*?)<\/h3>/i)?.[1]);
    const companyAnchor=fragment.match(/base-search-card__subtitle[\s\S]*?<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const companyProfile=publicUrl(companyAnchor?.[1]);
    const company=text(companyAnchor?.[2]);
    const location=text(fragment.match(/job-search-card__location[^>]*>([\s\S]*?)<\/span>/i)?.[1]);
    const publishedAt=fragment.match(/<time\b[^>]*datetime=["']([^"']+)/i)?.[1]||null;
    if(jobUrl&&companyProfile&&company&&rolePattern.test(title)) rows.push({jobUrl,title,company,companyProfile,location,publishedAt});
  }
  return rows;
}

function externalWebsite(companyHtml) {
  for(const match of companyHtml.matchAll(/<a\b[^>]*data-tracking-control-name=["']about_website["'][^>]*>/gi)) {
    const redirect=publicUrl(match[0].match(/href=["']([^"']+)/i)?.[1]);
    if(!redirect) continue;
    try {
      const target=new URL(redirect).searchParams.get('url');
      const website=publicUrl(target||redirect);
      if(website&&!/linkedin\.com$/i.test(new URL(website).hostname)) return website;
    } catch {}
  }
  return null;
}

function extractAnchors(html,base) {
  const anchors=[];
  for(const match of html.matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi)) {
    const url=publicUrl(match[1]||match[2],base);
    if(url) anchors.push({url,label:text(match[3])});
  }
  return anchors;
}

async function careerUrlFor(website) {
  if(careerPattern.test(new URL(website).pathname)) return website;
  try {
    const page=await fetchText(website);
    const candidates=extractAnchors(page.html,page.url)
      .filter(anchor=>careerPattern.test(`${anchor.label} ${new URL(anchor.url).pathname}`))
      .filter(anchor=>!/linkedin\.com|facebook\.com|instagram\.com|youtube\.com/i.test(anchor.url))
      .map(anchor=>({...anchor,score:(/careers?|jobs?|vacanc/i.test(new URL(anchor.url).pathname)?3:0)+(/careers?|jobs?|vacanc|open roles?/i.test(anchor.label)?2:0)}))
      .sort((a,b)=>b.score-a.score);
    for(const candidate of candidates.slice(0,4)) {
      try { return (await fetchText(candidate.url,{timeout:12000})).url; } catch {}
    }
    return page.url;
  } catch { return website; }
}

function geography(location,remote) {
  if(/cyprus|limassol|nicosia|paphos/i.test(location)) return ['Cyprus',location||'Remote'];
  if(/united kingdom|\buk\b|london|manchester|edinburgh|belfast/i.test(location)) return ['United Kingdom',location||'Remote'];
  if(/europe|european union|emea/i.test(location)) return ['Europe',location||'Remote'];
  return [remote?'Global':'Europe',remote?'Remote':location||'Remote'];
}

function industryFrom(html) {
  const match=html.match(/data-test-id=["']about-us__industry["'][^>]*>[\s\S]*?<dd\b[^>]*>([\s\S]*?)<\/dd>/i);
  return text(match?.[1])||'Technology';
}

const knownNames=new Set(companies.map(company=>companyKey(company.name)));
const knownHosts=new Set(companies.map(company=>{try{return new URL(company.careerUrl).hostname.replace(/^www\./,'');}catch{return'';}}));
const discoveredJobs=[];

for(const [keyword,location,remote] of searches) {
  const url=new URL('https://www.linkedin.com/jobs/search/');
  url.searchParams.set('keywords',keyword);
  url.searchParams.set('location',location);
  url.searchParams.set('f_TPR','r86400');
  url.searchParams.set('sortBy','DD');
  if(remote) url.searchParams.set('f_WT','2');
  try {
    const page=await fetchText(url.href);
    discoveredJobs.push(...parseCards(page.html).map(job=>({...job,remote})));
    console.log(`✓ LinkedIn ${keyword} · ${location}`);
  } catch(error) {
    console.warn(`× LinkedIn ${keyword} · ${location}: ${error.message}`);
  }
  await sleep(650);
}

const candidates=[...new Map(discoveredJobs.map(job=>[companyKey(job.company),job])).values()]
  .filter(job=>!knownNames.has(companyKey(job.company)))
  .filter(job=>!agencyPattern.test(job.company))
  .slice(0,maxNew*3);
const additions=[];

for(const job of candidates) {
  if(additions.length>=maxNew) break;
  try {
    const profile=await fetchText(job.companyProfile);
    if(agencyPattern.test(industryFrom(profile.html))) continue;
    const website=externalWebsite(profile.html);
    if(!website) continue;
    const host=new URL(website).hostname.replace(/^www\./,'');
    if(knownHosts.has(host)) continue;
    const careerUrl=await careerUrlFor(website);
    const [country,city]=geography(job.location,job.remote);
    additions.push({name:job.company,country,city,industry:industryFrom(profile.html),careerUrl,linkedinJob:job.jobUrl});
    knownNames.add(companyKey(job.company)); knownHosts.add(host);
    console.log(`+ ${job.company}: ${careerUrl}`);
  } catch(error) {
    console.warn(`× ${job.company}: ${error.message}`);
  }
  await sleep(500);
}

if(shouldWrite&&additions.length) {
  const source=await readFile(companiesPath,'utf8');
  const marker='].map(([name,country,city,industry,careerUrl], index) => ({';
  const rows=additions.map(company=>`  [${[company.name,company.country,company.city,company.industry,company.careerUrl].map(value=>JSON.stringify(value)).join(',')}],`).join('\n');
  if(!source.includes(marker)) throw new Error('Company list insertion point not found');
  await writeFile(companiesPath,source.replace(marker,`${rows}\n${marker}`));
}

console.log(JSON.stringify({searched:searches.length,linkedinJobs:discoveredJobs.length,candidates:candidates.length,added:additions.length,write:shouldWrite,companies:additions},null,2));
