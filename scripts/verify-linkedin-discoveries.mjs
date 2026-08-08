import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jobs } from '../src/data/jobs.js';
import { companies } from '../src/data/companies.js';
import { isLikelyDirectJobUrl } from './lib/career-urls.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const reportPath=resolve(root,'.linkedin-discovery-report.json');
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
  const details=unresolved.map(company=>`- ${company.name}: ${company.careerUrl} (LinkedIn evidence: ${company.linkedinJob})`).join('\n');
  throw new Error(`LinkedIn discovery verification failed. These companies were discovered through active QA/AQA roles, but no role was extracted from the official career source:\n${details}`);
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

console.log(`Verified ${discoveries.length} LinkedIn-discovered companies; every tracked company has an official reusable career listing, at least one active QA/AQA role, and no vacancy links back to LinkedIn.`);
