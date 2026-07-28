import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { companies } from '../src/data/companies.js';

const scriptPath = fileURLToPath(import.meta.url);
const root = resolve(dirname(scriptPath), '..');
const envPath = resolve(root, '.env');
try {
  for (const line of (await readFile(envPath,'utf8')).split(/\r?\n/)) {
    const match=line.match(/^([A-Z0-9_]+)=(.*)$/); if(match&&!process.env[match[1]]) process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');
  }
} catch {}

const sources = [
  { type:'lever', token:'binance', company:'Binance', industry:'Fintech' },
  { type:'lever', token:'capital', company:'Capital.com', industry:'Fintech' },
  { type:'lever', token:'cartrawler', company:'CarTrawler', industry:'TravelTech' },
  { type:'greenhouse', token:'datadog', company:'Datadog', industry:'Technology' },
  { type:'greenhouse', token:'cloudflare', company:'Cloudflare', industry:'Technology' },
  { type:'greenhouse', token:'gitlab', company:'GitLab', industry:'Technology' },
  { type:'greenhouse', token:'grafanalabs', company:'Grafana Labs', industry:'Technology' },
  { type:'greenhouse', token:'mongodb', company:'MongoDB', industry:'Technology' },
  { type:'greenhouse', token:'cockroachlabs', company:'Cockroach Labs', industry:'Technology' },
  { type:'greenhouse', token:'postman', company:'Postman', industry:'Technology' },
  { type:'greenhouse', token:'smartbear', company:'SmartBear', industry:'Testing' },
  { type:'greenhouse', token:'orioninnovation', company:'Orion Innovation', industry:'Banking tech' },
  { type:'greenhouse', token:'jetbrains', company:'JetBrains', industry:'Developer tools' },
  { type:'greenhouse', token:'brainrocketltd', company:'BrainRocket', industry:'Fintech / iGaming' },
  { type:'greenhouse', token:'clickhouse', company:'ClickHouse', industry:'Data infrastructure' },
  { type:'lever', token:'actian', company:'Actian', industry:'Data infrastructure' },
  { type:'greenhouse', token:'dkbcodefactory', company:'DKB Code Factory', industry:'Banking / fintech' },
  { type:'greenhouse', token:'sportygroup', company:'Sporty Group', industry:'Sports / iGaming' },
  { type:'greenhouse', token:'letsgetchecked', company:'LetsGetChecked', industry:'HealthTech' },
  { type:'greenhouse', token:'shifttechnology', company:'Shift Technology', industry:'Insurtech' },
  { type:'greenhouse', token:'idnow', company:'IDnow', industry:'Identity / fintech' },
  { type:'greenhouse', token:'platacard', company:'Plata', industry:'Digital banking', qaSpecialization:'QA' },
  { type:'greenhouse', token:'robinhood', company:'Robinhood', industry:'Fintech' },
  { type:'greenhouse', token:'justmarkets', company:'JustMarkets', industry:'Fintech / trading' },
  { type:'greenhouse', token:'rumble-external', company:'Rumble', industry:'MediaTech' },
  { type:'greenhouse', token:'dept', company:'DEPT', industry:'Digital services' },
  { type:'greenhouse', token:'xebiacee', company:'Xebia', industry:'Technology consulting' },
  { type:'greenhouse', token:'ttcglobal', company:'TTC Global', industry:'Testing services' },
  { type:'greenhouse', token:'divergent', company:'Divergent', industry:'Industrial software' },
  { type:'greenhouse', token:'xometryeurope', company:'Xometry Europe', industry:'Manufacturing tech' },
  { type:'greenhouse', token:'mechanicallicensingcollective', company:'The MLC', industry:'MusicTech' },
  { type:'lever', token:'revealtech', company:'Reveal Technology', industry:'Defense tech' },
  { type:'lever', token:'pingwind', company:'PingWind', industry:'GovTech' },
  { type:'ashby', token:'ruby-labs', company:'Ruby Labs', industry:'Payments' },
  { type:'ashby', token:'crackenagi', company:'Cracken', industry:'Cybersecurity' },
  { type:'ashby', token:'kraken.com', company:'Kraken', industry:'Fintech' },
  { type:'ashby', token:'mexdigital', company:'MultiBank Group', industry:'Banking / trading' },
  { type:'ashby', token:'injective-labs', company:'Injective Labs', industry:'Fintech' },
  { type:'ashby', token:'dualentry', company:'DualEntry', industry:'Fintech' },
  { type:'ashby', token:'Forward Financing', company:'Forward Financing', industry:'Fintech' },
  { type:'ashby', token:'binance.us', company:'Binance.US', industry:'Fintech' },
  { type:'ashby', token:'clair', company:'Clair', industry:'Digital banking' },
  { type:'ashby', token:'eisen', company:'Eisen', industry:'Banking tech' },
  { type:'ashby', token:'titan-ai', company:'Titan AI', industry:'Banking tech' },
  { type:'ashby', token:'super.com', company:'Super.com', industry:'Fintech' },
  { type:'ashby', token:'loancrate', company:'Loancrate', industry:'Mortgage fintech' },
  { type:'ashby', token:'hamsa', company:'Hamsa', industry:'Financial infrastructure' },
  { type:'ashby', token:'PaveBank', company:'Pave Bank', industry:'Digital banking' },
  { type:'ashby', token:'Lendable', company:'Lendable', industry:'Fintech' },
  { type:'ashby', token:'maxrewards', company:'MaxRewards', industry:'Fintech' },
  { type:'ashby', token:'masabi', company:'Masabi', industry:'Payments' },
  { type:'ashby', token:'gen-digital', company:'MoneyLion / Gen Digital', industry:'Fintech' },
  { type:'ashby', token:'Ferovinum', company:'Ferovinum', industry:'Fintech' },
  { type:'ashby', token:'Playbook', company:'Playbook', industry:'Consumer tech' },
  { type:'ashby', token:'infiterra', company:'Infiterra', industry:'SaaS' },
  { type:'ashby', token:'block-labs', company:'Block Labs', industry:'Web3 / iGaming' },
  { type:'ashby', token:'Vic.ai', company:'Vic.ai', industry:'Fintech' },
  { type:'ashby', token:'WA.Technology', company:'WA.Technology', industry:'Payments / iGaming' },
  { type:'ashby', token:'hostinger', company:'Hostinger', industry:'Technology' },
  { type:'ashby', token:'hyperexponential', company:'Hyperexponential', industry:'Insurtech' },
  { type:'ashby', token:'lndmrk', company:'Lndmrk', industry:'Technology' },
  { type:'ashby', token:'govworx', company:'GovWorx', industry:'GovTech' },
  { type:'ashby', token:'lightspeedhq', company:'Lightspeed', industry:'Payments / commerce' },
  { type:'ashby', token:'passport', company:'Passport', industry:'E-commerce tech' },
  { type:'ashby', token:'equip', company:'Equip Health', industry:'HealthTech' },
  { type:'ashby', token:'voodoo', company:'Voodoo / BeReal', industry:'Consumer tech' },
  { type:'ashby', token:'optro', company:'Optro', industry:'SaaS / RegTech' },
  { type:'ashby', token:'allwyn-corp', company:'Allwyn Corp', industry:'Technology' },
  { type:'ashby', token:'incard', company:'Incard', industry:'Fintech / banking' },
  { type:'ashby', token:'aghanim', company:'Aghanim', industry:'Payments / gaming' },
  { type:'ashby', token:'solidgate', company:'Solidgate', industry:'Payments' },
  { type:'ashby', token:'blockstream', company:'Blockstream', industry:'Fintech / blockchain' },
  { type:'direct', company:'Exness', industry:'Fintech / trading', jobs:[
    { title:'QA Engineer (AML Team)', location:'Limassol, Cyprus', format:'On-site', level:'Middle', description:'QA Automation Engineer for AML, client verification, screening and compliance services.', technologies:['API','Java','SQL'], url:'https://exness-careers.com/jobs/4846255101/?gh_jid=4846255101' }
  ]},
  { type:'direct', company:'TradingView', industry:'Fintech / trading', jobs:[
    { title:'Senior Mobile QA Engineer', location:'Cyprus', format:'Hybrid', level:'Senior', description:'Mobile QA for TradingView\'s native iOS and Android apps, including functional, UI, usability and localization testing plus Kotlin/Swift test automation in CI/CD.', technologies:['Mobile','iOS','Android','CI/CD'], url:'https://tradingview.teamtailor.com/jobs/7669723-senior-mobile-qa-engineer' }
  ]},
  { type:'direct', company:'Trust Insurance Cyprus', industry:'Insurtech', jobs:[
    { title:'Quality Assurance (QA) Engineer', location:'Nicosia, Cyprus', format:'On-site', level:'Middle', description:'Software quality assurance role at the Cyprus head office.', technologies:['API','SQL'], url:'https://www.trustcyprusinsurance.com/en/career/quality-assurance-engineer/' }
  ]},
  { type:'direct', company:'ISX Financial', industry:'Payments', jobs:[
    { title:'Junior QA Engineer', location:'Nicosia, Cyprus', format:'On-site', level:'Junior', description:'Junior software QA role for financial technology products in Nicosia.', technologies:['API','SQL'], url:'https://isx.financial/hubfs/Jobs/Junior%20QA%20Engineer_ISX.pdf?hsLang=en' }
  ]},
  { type:'direct', company:'paytech', industry:'Payments', jobs:[
    { title:'QA Manual (Payment Integrations)', location:'Limassol, Cyprus', format:'Hybrid', level:'Middle', description:'Manual QA for payment integrations in a fintech product team.', technologies:['API','Postman','SQL'], url:'https://www.pay.tech/careers' }
  ]},
  { type:'direct', company:'Voyage Privé', industry:'TravelTech', jobs:[
    { title:'QA Engineer - Full Remote or Hybrid', location:'France / Remote', format:'Remote', level:'Senior', description:'QA automation for an international travel platform using Playwright, TypeScript, Cucumber, XRay and CI/CD.', technologies:['Playwright','TypeScript','CI/CD'], url:'https://jobs.smartrecruiters.com/VoyagePriv/744000097543255-qa-engineer-full-remote-or-hybrid-m-f-d-' }
  ]}
];

const qa = /\b(qa|quality assurance|quality engineer|test engineer|software tester|sdet|test automation|automation engineer|quality analyst)\b/i;
const softwareSignal = /software|web|mobile|api|automation|selenium|playwright|cypress|appium|backend|frontend|application|platform|product|javascript|typescript|python|java/i;
const explicitSoftwareQATitle = /\b(qa|sdet|software test|test automation|quality assurance engineer)\b/i;
const regions = {
  Cyprus: /cyprus|limassol|nicosia/i,
  UAE: /uae|dubai|abu dhabi|united arab emirates/i,
  Canada: /canada|toronto|vancouver|montreal|ottawa|calgary/i,
  USA: /united states|u\.s\.|\busa\b|new york|california|texas|washington|boston|massachusetts|chicago|illinois|florida|seattle|san francisco|los angeles|denver|colorado|austin|miami|atlanta/i,
  Europe: /europe|emea|united kingdom|\buk\b|ireland|poland|portugal|spain|germany|netherlands|estonia|lithuania|czech|romania|bulgaria|greece|malta|serbia|georgia|armenia|france|italy|sweden|denmark|norway|finland|switzerland|austria|belgium|hungary|slovakia|croatia|latvia|slovenia|ukraine|tbilisi|bucharest|london|berlin|warsaw|prague/i,
  'Latin America': /latin america|latam|argentina|brazil|mexico|colombia|chile|peru|uruguay|costa rica/i,
  'Asia-Pacific': /asia|apac|india|singapore|hong kong|japan|korea|australia|new zealand|taiwan|thailand|philippines|indonesia|malaysia|vietnam/i,
  'Middle East / Africa': /middle east|africa|south africa|egypt|israel|saudi|qatar|bahrain|jordan|kenya|nigeria/i,
  Global: /remote|global|worldwide|anywhere/i
};
const regionOf = location => Object.entries(regions).find(([,pattern])=>pattern.test(location))?.[0] || 'Other';
const strip = html => String(html||'')
  .replace(/&amp;/gi,'&')
  .replace(/&lt;/gi,'<')
  .replace(/&gt;/gi,'>')
  .replace(/&quot;|&#34;/gi,'"')
  .replace(/&#39;|&apos;/gi,"'")
  .replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(Number.parseInt(code,16)))
  .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)))
  .replace(/<[^>]*>/g,' ')
  .replace(/&nbsp;/gi,' ')
  .replace(/&[a-z]+;|&#\d+;/gi,' ')
  .replace(/\s+/g,' ')
  .trim();
const techNames=['Java','Selenium','Appium','TestNG','JUnit','Maven','Gradle','REST Assured','Postman','API','SQL','PostgreSQL','Kafka','Redis','Docker','Kubernetes','CI/CD','Playwright','Cypress','Python','JavaScript','TypeScript','Mobile','iOS','Android'];
const tech = text => techNames.filter(x => new RegExp(x.replace('/','\\/'),'i').test(text));
const level = title => /lead|staff|principal/i.test(title)?'Lead':/senior|sr\.?/i.test(title)?'Senior':/junior|graduate|entry/i.test(title)?'Junior':'Middle';
const format = text => /remote/i.test(text)?'Remote':/hybrid/i.test(text)?'Hybrid':'On-site';
const score = (title,text,location) => Math.min(98, 62 + (/manual|quality assurance|qa engineer/i.test(title)?12:0) + (/mobile|ios|android/i.test(text)?8:0) + (/api|postman|rest/i.test(text)?7:0) + (/java|selenium|appium/i.test(text)?6:0) + (/cyprus|limassol/i.test(location)?8:0));

async function fetchJSON(url, headers={}) {
  const response=await fetch(url,{headers:{'user-agent':'QA-Career-Hub/1.0 (+personal job research)',accept:'application/json',...headers},signal:AbortSignal.timeout(18000)});
  if(!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function probeUrl(url,{timeout=12000}={}) {
  try {
    const response=await fetch(url,{
      method:'GET',
      redirect:'follow',
      signal:AbortSignal.timeout(timeout),
      headers:{
        'user-agent':'Mozilla/5.0 (compatible; QA-Career-Hub/1.0; +vacancy-link-audit)',
        accept:'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        range:'bytes=0-4095'
      }
    });
    await response.body?.cancel().catch(()=>{});
    const protectedStatus=[401,403,405,429].includes(response.status);
    return {
      status:response.ok?'reachable':protectedStatus?'protected':[404,410].includes(response.status)?'broken':'recheck',
      http:response.status,
      finalUrl:response.url,
      checkedAt:new Date().toISOString()
    };
  } catch(error) {
    if(error.cause?.code==='UND_ERR_HEADERS_OVERFLOW'){
      return {status:'protected',reason:'response headers exceed the automated client limit',checkedAt:new Date().toISOString()};
    }
    return {status:'recheck',error:error.message,checkedAt:new Date().toISOString()};
  }
}

async function mapWithConcurrency(items,limit,worker) {
  const results=new Array(items.length);
  let cursor=0;
  async function run() {
    while(cursor<items.length){
      const index=cursor++;
      results[index]=await worker(items[index],index);
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,items.length)},run));
  return results;
}

async function fetchSource(source) {
  if(source.type==='direct') {
    const rows=[];
    for(const [index,j] of source.jobs.entries()) {
      const check=await probeUrl(j.url,{timeout:18000});
      if(check.status==='broken') continue;
      rows.push({id:`direct-${source.company}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g,'-'),title:j.title,company:source.company,industry:source.industry,region:regionOf(j.location),location:j.location,format:j.format,level:j.level,description:j.description,requirements:j.description,technologies:j.technologies||tech(j.description),publishedAt:null,lastChecked:new Date().toISOString(),source:'Official career page',url:j.url,status:'active',matchScore:score(j.title,j.description,j.location)});
    }
    return rows;
  }
  if(source.type==='lever') {
    const rows=await fetchJSON(`https://api.lever.co/v0/postings/${source.token}?mode=json`);
    return rows.map(j=>{
      const description=strip(`${j.descriptionPlain||j.description||''} ${(j.lists||[]).map(x=>`${x.text} ${strip(x.content)}`).join(' ')}`);
      const location=(j.categories?.allLocations||[j.categories?.location]).filter(Boolean).join(' / ')||'Not specified';
      return {id:`lever-${j.id}`,title:j.text,company:source.company,industry:source.industry,region:regionOf(location),location,format:format(`${j.workplaceType} ${location}`),level:level(j.text),description:description.slice(0,260),requirements:description.slice(0,520),technologies:tech(description),publishedAt:null,lastChecked:new Date().toISOString(),source:'Lever · official ATS',url:j.hostedUrl,status:'active',matchScore:score(j.text,description,location)};
    });
  }
  if(source.type==='ashby') {
    const data=await fetchJSON(`https://api.ashbyhq.com/posting-api/job-board/${source.token}`);
    return (data.jobs||[]).filter(j=>j.isListed!==false).map(j=>{
      const description=strip(j.descriptionPlain||j.descriptionHtml);
      const location=[j.location,...(j.secondaryLocations||[]).map(x=>typeof x==='string'?x:x.location||x.name)].filter(Boolean).join(' / ')||'Not specified';
      return {id:`ashby-${j.id||j.jobUrl}`,title:j.title,company:source.company,industry:source.industry,region:regionOf(location),location,format:j.workplaceType==='Remote'?'Remote':format(`${j.workplaceType} ${location} ${description.slice(0,800)}`),level:level(j.title),description:description.slice(0,260),requirements:description.slice(0,520),technologies:tech(description),publishedAt:j.publishedAt||null,lastChecked:new Date().toISOString(),source:'Ashby · official ATS',url:j.jobUrl||j.applyUrl,status:'active',matchScore:score(j.title,description,location)};
    });
  }
  const data=await fetchJSON(`https://boards-api.greenhouse.io/v1/boards/${source.token}/jobs?content=true`);
  return (data.jobs||[]).map(j=>{
    const description=strip(j.content);const location=j.location?.name||'Not specified';
    const specialization=j.metadata?.find(item=>item.name==='Specialization')?.value||null;
    const workModel=j.metadata?.find(item=>item.name==='work_model')?.value||'';
    return {id:`gh-${j.id}`,title:j.title,company:source.company,industry:source.industry,region:regionOf(location),location,format:format(`${workModel} ${location}`),level:level(j.title),description:description.slice(0,260),requirements:description.slice(0,520),technologies:tech(description),specialization,publishedAt:j.updated_at||null,lastChecked:new Date().toISOString(),source:'Greenhouse · official ATS',url:j.absolute_url,status:'active',matchScore:score(j.title,description,location)};
  });
}

export async function collectJobs({checkCompanies=false}={}) {
  const report={generatedAt:new Date().toISOString(),sources:[],companies:[],errors:[]};
  const all=[];

  // Источники независимы, но ограничиваем параллельность, чтобы не терять ответы из-за перегрузки соединений.
  const sourceResults=await mapWithConcurrency(sources,12,async source=>{
    try {
      const rows=await fetchSource(source);
      const accepted=rows.filter(j=>source.qaSpecialization
        ? j.specialization?.toLowerCase()===source.qaSpecialization.toLowerCase()
        : qa.test(j.title)&&(explicitSoftwareQATitle.test(j.title)||softwareSignal.test(`${j.title} ${j.description} ${j.requirements}`)));
      return {source,rows,accepted};
    } catch(error) {
      return {source,error};
    }
  });

  for(const result of sourceResults){
    if(result.error){
      report.sources.push({...result.source,status:'error',error:result.error.message});
      report.errors.push(`${result.source.company}: ${result.error.message}`);
      console.warn(`× ${result.source.company}: ${result.error.message}`);
      continue;
    }
    all.push(...result.accepted);
    report.sources.push({...result.source,status:'ok',seen:result.rows.length,accepted:result.accepted.length});
    console.log(`✓ ${result.source.company}: ${result.accepted.length}/${result.rows.length}`);
  }

  let linkedinJobs=[];let linkedinConnected=false;
  if(process.env.LINKEDIN_API_URL&&process.env.LINKEDIN_API_TOKEN){
    try{const data=await fetchJSON(process.env.LINKEDIN_API_URL,{authorization:`Bearer ${process.env.LINKEDIN_API_TOKEN}`});linkedinJobs=(Array.isArray(data)?data:data.jobs||[]).slice(0,10);linkedinConnected=true;}
    catch(error){report.errors.push(`LinkedIn adapter: ${error.message}`);}
  }

  const jobs=[...new Map(all.map(j=>[`${j.company}|${j.title}|${j.location}`.toLowerCase(),j])).values()].sort((a,b)=>(b.matchScore||0)-(a.matchScore||0));
  const coveredCompanies=report.sources.filter(x=>x.status==='ok').map(x=>x.company);

  if(checkCompanies){
    const counts=jobs.reduce((result,job)=>{
      const key=job.company.toLowerCase();
      result.set(key,(result.get(key)||0)+1);
      return result;
    },new Map());
    report.companies=await mapWithConcurrency(companies,10,async company=>({
      name:company.name,
      url:company.careerUrl,
      vacancyCount:counts.get(company.name.toLowerCase())||0,
      ...(await probeUrl(company.careerUrl))
    }));
    report.jobLinks=await mapWithConcurrency(jobs,12,async job=>({
      id:job.id,
      company:job.company,
      title:job.title,
      url:job.url,
      ...(await probeUrl(job.url))
    }));
  }

  const validCareerLinks=checkCompanies?report.companies.filter(x=>['reachable','protected'].includes(x.status)).length:0;
  const validJobLinks=checkCompanies?report.jobLinks.filter(x=>['reachable','protected'].includes(x.status)).length:0;
  const companyStatus=checkCompanies?` Career URL: ${validCareerLinks}/${companies.length}. Vacancy URL: ${validJobLinks}/${jobs.length}.`:'';
  const meta={generatedAt:report.generatedAt,linkedinConnected,coveredCompanies,message:`Проверено ATS: ${report.sources.filter(x=>x.status==='ok').length}/${sources.length}.${companyStatus} Ошибки не остановили остальные источники.`};
  return {jobs,linkedinJobs,meta,report};
}

if(process.argv[1]&&resolve(process.argv[1])===scriptPath){
  const result=await collectJobs({checkCompanies:true});
  await writeFile(resolve(root,'src/data/jobs.js'),`// Автоматически создано scripts/update-jobs.mjs\nexport const jobs = ${JSON.stringify(result.jobs,null,2)};\nexport const linkedinJobs = ${JSON.stringify(result.linkedinJobs,null,2)};\nexport const jobMeta = ${JSON.stringify(result.meta,null,2)};\n`);
  await writeFile(resolve(root,'update-report.json'),JSON.stringify(result.report,null,2));
  console.log(`\nГотово: ${result.jobs.length} активных QA-вакансий. LinkedIn API: ${result.meta.linkedinConnected?'подключён':'не подключён'}.`);
}
