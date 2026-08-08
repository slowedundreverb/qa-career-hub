import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jobs } from '../src/data/jobs.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const reportPath=resolve(root,'.linkedin-discovery-report.json');
const companyKey=value=>String(value||'').replace(/\.US$/,'').replace(/\s*\/\s*Gen Digital$/,'').trim().toLowerCase();

const raw=process.env.LINKEDIN_DISCOVERY_REPORT||await readFile(reportPath,'utf8');
const report=JSON.parse(raw);
const discoveries=Array.isArray(report.companies)?report.companies:[];
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

console.log(`Verified ${discoveries.length} LinkedIn-discovered companies; every published company has at least one active official QA/AQA role.`);
