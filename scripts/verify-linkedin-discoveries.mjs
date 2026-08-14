import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jobs } from '../src/data/jobs.js';
import { companies } from '../src/data/companies.js';
import { isLikelyDirectJobUrl } from './lib/career-urls.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const reportPath=resolve(root,'.linkedin-discovery-report.json');
const strict=process.argv.includes('--strict')||process.env.LINKEDIN_DISCOVERY_STRICT==='1';
const companyKey=value=>String(value||'').replace(/\.US$/,'').replace(/\s*\/\s*Gen Digital$/,'').trim().toLowerCase();

let report={companies:[]};
try {
  const raw=process.env.LINKEDIN_DISCOVERY_REPORT||await readFile(reportPath,'utf8');
  report=JSON.parse(raw);
} catch(error) {
  if(process.env.LINKEDIN_DISCOVERY_REPORT||error.code!=='ENOENT') throw error;
}
const currentDiscoveries=Array.isArray(report.companies)?report.companies:[];
const trackedDiscoveries=companies.filter(company=>company.discovery==='linkedin');
const discoveries=[...new Map([...trackedDiscoveries,...currentDiscoveries].map(company=>[companyKey(company.name),company])).values()];
const activeCounts=new Map();

for(const job of jobs) {
  if(job.status==='closed') continue;
  const key=companyKey(job.company);
  activeCounts.set(key,(activeCounts.get(key)||0)+1);
}

const unresolved=discoveries.filter(company=>(activeCounts.get(companyKey(company.name))||0)===0);
if(unresolved.length) {
  const issues=unresolved.map(company=>({
    name:company.name,
    careerUrl:company.careerUrl||'',
    linkedinJob:company.linkedinEvidence?.linkedinJob||company.linkedinJob||''
  }));
  const details=issues.map(company=>`- ${company.name}: ${company.careerUrl}${company.linkedinJob?` (LinkedIn evidence: ${company.linkedinJob})`:''}`).join('\n');
  const message=`LinkedIn discoveries need manual review. An active role was seen on LinkedIn, but this run could not extract a QA/AQA role from the official career source:\n${details}`;
  report.verification={
    generatedAt:new Date().toISOString(),
    status:'needs-review',
    unresolved:issues
  };
  if(!process.env.LINKEDIN_DISCOVERY_REPORT) {
    await writeFile(reportPath,`${JSON.stringify(report,null,2)}\n`);
  }
  console.warn(message);
  for(const company of issues) {
    console.log(`::warning title=Career source needs review::${company.name}: no QA/AQA role was extracted from ${company.careerUrl}`);
  }
  if(process.env.GITHUB_STEP_SUMMARY) {
    const rows=issues.map(company=>`| ${company.name} | ${company.careerUrl||'—'} | ${company.linkedinJob||'—'} |`).join('\n');
    await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Career sources needing review\n\nThe daily update continued so verified vacancies and the private archive were not lost.\n\n| Company | Official source | LinkedIn evidence |\n| --- | --- | --- |\n${rows}\n\n`);
  }
  if(strict) throw new Error(message);
} else {
  report.verification={
    generatedAt:new Date().toISOString(),
    status:'verified',
    unresolved:[]
  };
  if(!process.env.LINKEDIN_DISCOVERY_REPORT) {
    await writeFile(reportPath,`${JSON.stringify(report,null,2)}\n`);
  }
}

const directListingUrls=companies.filter(company=>isLikelyDirectJobUrl(company.careerUrl));
if(directListingUrls.length) {
  const details=directListingUrls.map(company=>`- ${company.name}: ${company.careerUrl}`).join('\n');
  throw new Error(`Company source verification failed. Company links must open reusable career listings, not individual vacancies:\n${details}`);
}

const linkedinJobLinks=jobs.filter(job=>discoveries.some(company=>companyKey(company.name)===companyKey(job.company))&&/linkedin\.com/i.test(job.url));
if(linkedinJobLinks.length) {
  const details=linkedinJobLinks.map(job=>`- ${job.company}: ${job.title} -> ${job.url}`).join('\n');
  throw new Error(`LinkedIn discovery verification failed. Published roles must link to an official company or ATS page, not back to LinkedIn:\n${details}`);
}

if(unresolved.length) {
  console.log(`Audited ${discoveries.length} LinkedIn-discovered companies; ${unresolved.length} career source(s) were queued for manual review and the remaining verified data can be published.`);
} else {
  console.log(`Verified ${discoveries.length} LinkedIn-discovered companies; every tracked company has an official reusable career listing, at least one active QA/AQA role, and no vacancy links back to LinkedIn.`);
}
