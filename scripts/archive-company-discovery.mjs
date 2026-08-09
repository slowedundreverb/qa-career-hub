import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { companies as trackedCompanies } from '../src/data/companies.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const arg=value=>{
  const index=process.argv.indexOf(value);
  return index>=0?process.argv[index+1]:null;
};
const outputDir=resolve(root,arg('--output')||'private-company-log');
const reportPath=resolve(root,arg('--report')||'.linkedin-discovery-report.json');
const seedCurrent=process.argv.includes('--seed-current');

const cleanCompany=company=>({
  name:String(company.name||'').trim(),
  country:String(company.country||'').trim(),
  city:String(company.city||'').trim(),
  industry:String(company.industry||'').trim(),
  careerUrl:String(company.careerUrl||'').trim(),
  verifiedRole:String(company.verifiedRole||'').trim(),
  verifiedJobUrl:String(company.verifiedJobUrl||'').trim(),
  linkedinJob:String(company.linkedinJob||'').trim()
});
const cleanCandidate=candidate=>({
  name:String(candidate.name||'').trim(),
  title:String(candidate.title||'').trim(),
  location:String(candidate.location||'').trim(),
  publishedAt:String(candidate.publishedAt||'').trim(),
  linkedinJob:String(candidate.linkedinJob||'').trim(),
  linkedinCompany:String(candidate.linkedinCompany||'').trim(),
  website:String(candidate.website||'').trim(),
  careerUrl:String(candidate.careerUrl||'').trim(),
  verifiedJobUrl:String(candidate.verifiedJobUrl||'').trim(),
  verifiedRole:String(candidate.verifiedRole||'').trim(),
  status:String(candidate.status||'unknown').trim(),
  reason:String(candidate.reason||'').trim()
});

let report;
if(seedCurrent) {
  report={
    generatedAt:new Date().toISOString(),
    searched:12,
    linkedinJobs:null,
    candidates:null,
    companies:trackedCompanies.filter(company=>company.discovery==='linkedin'),
    seededFromCurrentCatalogue:true
  };
} else {
  report=JSON.parse(await readFile(reportPath,'utf8'));
}

const generatedAt=new Date(report.generatedAt||Date.now()).toISOString();
const date=generatedAt.slice(0,10);
const runCompanies=(Array.isArray(report.companies)?report.companies:[])
  .map(cleanCompany)
  .filter(company=>company.name&&company.careerUrl)
  .sort((left,right)=>left.name.localeCompare(right.name,'en'));
const runCandidates=(Array.isArray(report.candidateCompanies)?report.candidateCompanies:[])
  .map(cleanCandidate)
  .filter(candidate=>candidate.name)
  .sort((left,right)=>left.name.localeCompare(right.name,'en'));
let previous=null;
try { previous=JSON.parse(await readFile(resolve(outputDir,'daily',`${date}.json`),'utf8')); } catch {}
const companyMap=new Map();
for(const company of [...(previous?.companies||[]),...runCompanies]) {
  const clean=cleanCompany(company);
  if(clean.name&&clean.careerUrl) {
    const key=clean.name.toLowerCase();
    const existing=companyMap.get(key)||{};
    companyMap.set(key,Object.fromEntries(Object.entries(clean).map(([field,value])=>[field,value||existing[field]||''])));
  }
}
const companies=[...companyMap.values()].sort((left,right)=>left.name.localeCompare(right.name,'en'));
const candidateMap=new Map();
for(const candidate of [...(previous?.candidates||[]),...runCandidates]) {
  const clean=cleanCandidate(candidate);
  if(clean.name) candidateMap.set(clean.name.toLowerCase(),clean);
}
const candidates=[...candidateMap.values()].sort((left,right)=>left.name.localeCompare(right.name,'en'));
const run={
  generatedAt,
  searchedQueries:Number.isFinite(report.searched)?report.searched:null,
  linkedinJobsFound:Number.isFinite(report.linkedinJobs)?report.linkedinJobs:null,
  candidateCompanies:Number.isFinite(report.candidates)?report.candidates:null,
  addedCount:runCompanies.length,
  companies:runCompanies.map(company=>company.name),
  candidates:runCandidates
};
const runMap=new Map((previous?.runs||[]).map(item=>[item.generatedAt,item]));
if(previous?.generatedAt&&!runMap.has(previous.generatedAt)) {
  runMap.set(previous.generatedAt,{
    generatedAt:previous.generatedAt,
    searchedQueries:previous.searchedQueries??null,
    linkedinJobsFound:previous.linkedinJobsFound??null,
    candidateCompanies:previous.candidateCompanies??null,
    addedCount:previous.addedCount||0,
    companies:(previous.companies||[]).map(company=>company.name),
    candidates:previous.candidates||[]
  });
}
runMap.set(generatedAt,run);
const record={
  date,
  generatedAt,
  runCount:runMap.size,
  addedCount:companies.length,
  companies,
  candidateCount:candidates.length,
  candidates,
  runs:[...runMap.values()].sort((left,right)=>left.generatedAt.localeCompare(right.generatedAt))
};

const dailyDir=resolve(outputDir,'daily');
await mkdir(dailyDir,{recursive:true});
await writeFile(resolve(dailyDir,`${date}.json`),`${JSON.stringify(record,null,2)}\n`);

const dailyFiles=(await readdir(dailyDir)).filter(file=>/^\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort().reverse();
const days=[];
for(const file of dailyFiles) {
  try { days.push(JSON.parse(await readFile(resolve(dailyDir,file),'utf8'))); } catch {}
}

const firstSeen=new Map();
for(const day of [...days].reverse()) {
  for(const company of day.companies||[]) {
    const key=company.name.toLowerCase();
    if(!firstSeen.has(key)) firstSeen.set(key,{...company,firstSeen:day.date});
  }
}
const index={
  updatedAt:generatedAt,
  recordedDays:days.length,
  totalAddedEvents:days.reduce((sum,day)=>sum+(day.addedCount||0),0),
  uniqueCompanies:[...firstSeen.values()].sort((left,right)=>left.name.localeCompare(right.name,'en')),
  days
};
await writeFile(resolve(outputDir,'index.json'),`${JSON.stringify(index,null,2)}\n`);

const md=value=>String(value||'').replace(/\|/g,'\\|').replace(/\r?\n/g,' ');
const companyLinks=company=>company.careerUrl?`[${md(company.name)}](${company.careerUrl})`:md(company.name);
const dayRows=days.map(day=>`| ${day.date} | ${day.candidateCount??day.runs?.at(-1)?.candidateCompanies??0} | ${day.addedCount||0} | ${(day.companies||[]).map(companyLinks).join(', ')||'—'} |`).join('\n');
const companyRows=index.uniqueCompanies.map(company=>`| ${company.firstSeen} | ${companyLinks(company)} | ${md(company.country)} | ${md(company.verifiedRole)||'—'} |`).join('\n');
const readme=`# QA Career Hub — private company discovery log

Private archive generated by the daily QA company discovery workflow. It is intentionally stored outside the public website repository.

## Daily runs

| Date (UTC) | Candidates | Added | Companies |
| --- | ---: | ---: | --- |
${dayRows||'| — | 0 | 0 | — |'}

## Companies added over time

| First seen | Company | Geography | Verified QA/AQA role |
| --- | --- | --- | --- |
${companyRows||'| — | — | — | — |'}
`;
await writeFile(resolve(outputDir,'README.md'),readme);

console.log(`Archived ${runCompanies.length} additions from this run and ${companies.length} total for ${date}; ${index.uniqueCompanies.length} unique companies recorded privately.`);
