import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { companies } from '../src/data/companies.js';
import { jobs as previousJobs } from '../src/data/jobs.js';

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
  { type:'deel', token:'klarna', company:'Klarna', industry:'Fintech', includeAllQuality:true },
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
  { type:'ashby', token:'gen-digital', company:'MoneyLion', industry:'Fintech' },
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
  { type:'lever', apiRegion:'eu', token:'xm', company:'XM', industry:'Fintech' },
  { type:'greenhouse', token:'canonical', company:'Canonical', industry:'Cloud' },
  { type:'lever', token:'contentsquare', company:'Contentsquare', industry:'SaaS' },
  { type:'greenhouse', token:'monzo', company:'Monzo', industry:'Fintech' },
  { type:'ashby', token:'teya', company:'Teya', industry:'Payments' },
  { type:'workable', token:'joom', company:'Joom', industry:'E-commerce' },
  { type:'workable', token:'payabl', company:'payabl.', industry:'Payments' },
  { type:'workable', token:'thesoul-publishing-1', company:'TheSoul Publishing', industry:'MediaTech' },
  { type:'smartrecruiters', token:'Playtech', company:'Playtech', industry:'iGaming' },
  { type:'bamboohr', token:'fxpro', company:'FxPro', industry:'Fintech' },
  { type:'workday', host:'browserstack.wd3.myworkdayjobs.com', tenant:'browserstack', site:'External', company:'BrowserStack', industry:'Testing' },
  { type:'workday', host:'ncratleos.wd1.myworkdayjobs.com', tenant:'ncratleos', site:'ext_non_usalteos', company:'NCR Atleos', industry:'Fintech' },
  { type:'workday', host:'mastercard.wd1.myworkdayjobs.com', tenant:'mastercard', site:'CorporateCareers', company:'Mastercard', industry:'Payments' },
  { type:'workday', host:'visa.wd5.myworkdayjobs.com', tenant:'visa', site:'Visa', company:'Visa', industry:'Payments' },
  { type:'workday', host:'worldpay.wd5.myworkdayjobs.com', tenant:'worldpay', site:'Worldpay_External_Careers_Site', company:'Worldpay', industry:'Payments' },
  { type:'workday', host:'tsys.wd1.myworkdayjobs.com', tenant:'tsys', site:'TSYS', company:'Global Payments', industry:'Payments' },
  { type:'workday', host:'zendesk.wd1.myworkdayjobs.com', tenant:'zendesk', site:'zendesk', company:'Zendesk', industry:'SaaS' },
  { type:'direct', company:'TradingView', industry:'Fintech / trading', jobs:[
    { title:'Senior Mobile QA Engineer', location:'Cyprus', format:'Hybrid', level:'Senior', description:'Mobile QA for TradingView\'s native iOS and Android apps, including functional, UI, usability and localization testing plus Kotlin/Swift test automation in CI/CD.', technologies:['Mobile','iOS','Android','CI/CD'], url:'https://tradingview.teamtailor.com/jobs/7669723-senior-mobile-qa-engineer' }
  ]},
  { type:'direct', company:'ISX Financial', industry:'Payments', jobs:[
    { title:'Junior QA Engineer', location:'Nicosia, Cyprus', format:'On-site', level:'Junior', description:'Junior software QA role for financial technology products in Nicosia.', technologies:['API','SQL'], url:'https://isx.financial/hubfs/Jobs/Junior%20QA%20Engineer_ISX.pdf?hsLang=en' }
  ]},
  { type:'direct', company:'Voyage Privé', industry:'TravelTech', jobs:[
    { title:'QA Engineer - Full Remote or Hybrid', location:'France / Remote', format:'Remote', level:'Senior', description:'QA automation for an international travel platform using Playwright, TypeScript, Cucumber, XRay and CI/CD.', technologies:['Playwright','TypeScript','CI/CD'], url:'https://jobs.smartrecruiters.com/VoyagePriv/744000097543255-qa-engineer-full-remote-or-hybrid-m-f-d-' }
  ]}
];

const qa = /\b(qa|quality assurance|quality engineer|test engineer|software tester|sdet|test automation|automation engineer|quality analyst)\b/i;
const softwareSignal = /software|web|mobile|api|automation|selenium|playwright|cypress|appium|backend|frontend|application|platform|product|javascript|typescript|python|java/i;
const explicitSoftwareQATitle = /\b(qa|sdet|software test|test automation|quality (?:assurance )?engineer)\b/i;
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
const countryPatterns = [
  ['Cyprus', /\b(?:cyprus|limassol|nicosia|paphos|ypsonas|latsia|lefkosia|cy)\b/i],
  ['United Arab Emirates', /\b(?:united arab emirates|uae|dubai|abu dhabi)\b/i],
  ['United States', /\b(?:united states|usa|u\.s\.|new york|california|san francisco|seattle|boston|austin|chicago|denver|miami|atlanta|arizona|south carolina|tempe|menlo park|columbus)\b/i],
  ['United Kingdom', /\b(?:united kingdom|uk|london|manchester|edinburgh|belfast)\b/i],
  ['Canada', /\b(?:canada|toronto|vancouver|montreal|ottawa|calgary)\b/i],
  ['Germany', /\b(?:germany|berlin|munich|hamburg|frankfurt|cologne)\b/i],
  ['Spain', /\b(?:spain|madrid|barcelona|valencia|malaga)\b/i],
  ['Netherlands', /\b(?:netherlands|amsterdam|rotterdam|utrecht)\b/i],
  ['Italy', /\b(?:italy|milan|rome|turin)\b/i],
  ['France', /\b(?:france|paris|rennes|lyon|marseille)\b/i],
  ['Ireland', /\b(?:ireland|dublin|cork|\birl\b)\b/i],
  ['Poland', /\b(?:poland|warsaw|krakow|kraków|wroclaw|wrocław|gdansk|gdańsk)\b/i],
  ['Portugal', /\b(?:portugal|lisbon|porto)\b/i],
  ['Serbia', /\b(?:serbia|belgrade|novi sad)\b/i],
  ['Armenia', /\b(?:armenia|yerevan)\b/i],
  ['Estonia', /\b(?:estonia|tallinn|tartu)\b/i],
  ['Czech Republic', /\b(?:czech(?: republic|ia)?|prague|\bcze\b)\b/i],
  ['Romania', /\b(?:romania|bucharest|cluj)\b/i],
  ['Bulgaria', /\b(?:bulgaria|sofia)\b/i],
  ['Greece', /\b(?:greece|athens|thessaloniki)\b/i],
  ['Malta', /\b(?:malta|valletta)\b/i],
  ['Ukraine', /\b(?:ukraine|kyiv|kiev|lviv)\b/i],
  ['Georgia', /\b(?:georgia|tbilisi|batumi)\b/i],
  ['Sweden', /\b(?:sweden|stockholm)\b/i],
  ['Denmark', /\b(?:denmark|copenhagen)\b/i],
  ['Norway', /\b(?:norway|oslo)\b/i],
  ['Finland', /\b(?:finland|helsinki)\b/i],
  ['Switzerland', /\b(?:switzerland|zurich|geneva)\b/i],
  ['Austria', /\b(?:austria|vienna)\b/i],
  ['Belgium', /\b(?:belgium|brussels)\b/i],
  ['Hungary', /\b(?:hungary|budapest)\b/i],
  ['Lithuania', /\b(?:lithuania|vilnius|kaunas)\b/i],
  ['Latvia', /\b(?:latvia|riga)\b/i],
  ['Slovenia', /\b(?:slovenia|ljubljana)\b/i],
  ['Croatia', /\b(?:croatia|zagreb)\b/i],
  ['Slovakia', /\b(?:slovakia|bratislava)\b/i],
  ['Israel', /\b(?:israel|tel aviv|jerusalem)\b/i],
  ['India', /\b(?:india|bengaluru|bangalore|chennai|hyderabad|mumbai|pune|\bind\b)\b/i],
  ['Singapore', /\b(?:singapore)\b/i],
  ['Malaysia', /\b(?:malaysia|kuala lumpur|\bmys\b)\b/i],
  ['Hong Kong', /\b(?:hong kong)\b/i],
  ['Japan', /\b(?:japan|tokyo|osaka)\b/i],
  ['Taiwan', /\b(?:taiwan|taipei)\b/i],
  ['Thailand', /\b(?:thailand|bangkok)\b/i],
  ['Australia', /\b(?:australia|sydney|melbourne|brisbane)\b/i],
  ['New Zealand', /\b(?:new zealand|auckland|wellington)\b/i],
  ['Brazil', /\b(?:brazil|sao paulo|são paulo)\b/i],
  ['Mexico', /\b(?:mexico|mexico city)\b/i],
  ['Costa Rica', /\b(?:costa rica|san jos[eé])\b/i],
  ['Argentina', /\b(?:argentina|buenos aires)\b/i],
  ['Colombia', /\b(?:colombia|bogota|bogotá)\b/i],
  ['China', /\b(?:china|beijing|shanghai|shenzhen|xian|xi'an|shaanxi)\b/i],
  ['South Africa', /\b(?:south africa|cape town|johannesburg)\b/i]
];
const countryOf = location => {
  const value=String(location||'');
  const matches=countryPatterns.filter(([,pattern])=>pattern.test(value)).map(([country])=>country);
  if(matches.length) return [...new Set(matches)].join(' / ');
  if(/\b(?:europe|emea|european union|eu only)\b/i.test(value)) return 'Europe · multiple countries';
  if(/\b(?:remote|global|worldwide|anywhere)\b/i.test(value)) return 'Worldwide';
  if(/\b(?:asia|apac|latin america|latam|middle east|africa)\b/i.test(value)) return `${strip(value).slice(0,80)} · multiple countries`;
  return 'Country not specified';
};
const strip = html => String(html||'')
  .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
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
  let lastError;
  for(let attempt=0;attempt<3;attempt++){
    try {
      const response=await fetch(url,{headers:{'user-agent':'QA-Career-Hub/1.0 (+personal job research)',accept:'application/json',...headers},signal:AbortSignal.timeout(30000)});
      if(!response.ok) {
        const error=new Error(`${response.status} ${response.statusText}`);
        if(![429,500,502,503,504].includes(response.status)) { error.retryable=false; throw error; }
        lastError=error;
      } else return response.json();
    } catch(error) {
      lastError=error;
      if(error.retryable===false) break;
      if(attempt===2) break;
    }
    await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));
  }
  throw lastError;
}

async function fetchText(url,{method='GET',headers={},body,timeout=18000,retries=1}={}) {
  let lastError;
  for(let attempt=0;attempt<=retries;attempt++){
    try {
      const response=await fetch(url,{
        method,
        redirect:'follow',
        body,
        headers:{
          'user-agent':'Mozilla/5.0 (compatible; QA-Career-Hub/1.0; +official-vacancy-research)',
          accept:'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          ...headers
        },
        signal:AbortSignal.timeout(timeout)
      });
      if(!response.ok) {
        const error=new Error(`${response.status} ${response.statusText}`);
        if(![429,500,502,503,504].includes(response.status)) { error.retryable=false; throw error; }
        lastError=error;
      } else return {text:await response.text(),url:response.url,status:response.status};
    } catch(error) {
      lastError=error;
      if(error.retryable===false) break;
      if(attempt===retries) break;
    }
    await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));
  }
  throw lastError;
}

const titleSignal=/\b(?:qa|quality assurance|quality engineer|quality engineering|software test(?:er|ing)?|test engineer|test automation|automation test|sdet)\b/i;
const listingSignal=/\b(?:jobs?|vacanc(?:y|ies)|positions?|open roles?|openings?|opportunities|careers?)\b/i;
const ctaSignal=/\b(?:view|see|explore|find|search|browse|show|all|open|current|available|join)\b/i;

const normalizeUrl=(value,base)=>{
  try {
    const url=new URL(value,base);
    if(!/^https?:$/.test(url.protocol)) return null;
    url.hash='';
    return url.href;
  } catch { return null; }
};

function extractAnchors(html,baseUrl) {
  const anchors=[];
  const pattern=/<a\b[^>]*?href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while((match=pattern.exec(html))){
    const url=normalizeUrl(match[1]||match[2]||match[3],baseUrl);
    if(!url) continue;
    anchors.push({url,text:strip(match[4]),index:match.index});
  }
  return anchors;
}

function headingBefore(html,index) {
  const fragment=html.slice(Math.max(0,index-5000),index);
  const headings=[...fragment.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)];
  return strip(headings.at(-1)?.[1]||'');
}

function isConcreteJobUrl(url,listingUrl) {
  try {
    const candidate=new URL(url); const listing=new URL(listingUrl);
    const candidateKey=`${candidate.origin}${candidate.pathname}`.replace(/\/$/,'');
    const listingKey=`${listing.origin}${listing.pathname}`.replace(/\/$/,'');
    if(candidateKey===listingKey) return false;
    const path=`${candidate.pathname}${candidate.search}`;
    if(/\/apply(?:\/|\?|$)/i.test(path)) return true;
    if(/(?:jobs?|vacanc(?:y|ies)|positions?|openings?|careers?|roles?)/i.test(path)) {
      return /[0-9a-f]{8,}|\d{5,}|[?&](?:id|job|pid|gh_jid)=/i.test(path)
        || path.split('/').filter(Boolean).length>=3;
    }
    return false;
  } catch { return false; }
}

function jsonLdJobs(html,source,pageUrl) {
  const rows=[];
  for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try {
      const parsed=JSON.parse(match[1]);
      const queue=Array.isArray(parsed)?[...parsed]:[parsed];
      while(queue.length){
        const item=queue.shift();
        if(!item||typeof item!=='object') continue;
        if(Array.isArray(item)){queue.push(...item);continue;}
        if(item['@graph']) queue.push(...(Array.isArray(item['@graph'])?item['@graph']:[item['@graph']]));
        const type=Array.isArray(item['@type'])?item['@type'].join(' '):item['@type'];
        if(!/JobPosting/i.test(String(type||''))) continue;
        const title=strip(item.title||item.name);
        const description=strip(item.description);
        const locations=[];
        const jobLocations=Array.isArray(item.jobLocation)?item.jobLocation:[item.jobLocation];
        for(const entry of jobLocations.filter(Boolean)){
          const address=entry.address||entry;
          locations.push([address.addressLocality,address.addressRegion,address.addressCountry?.name||address.addressCountry].filter(Boolean).join(', '));
        }
        const location=locations.filter(Boolean).join(' / ')||item.jobLocationType||source.location||'Not specified';
        const url=normalizeUrl(item.url||item.sameAs,pageUrl);
        if(titleSignal.test(title)&&url) rows.push(toJob(source,{id:`jsonld-${url}`,title,description,location,url,publishedAt:item.datePosted||null,sourceLabel:'Official career page · structured listing'}));
      }
    } catch {}
  }
  return rows;
}

function toJob(source,{id,title,description='',location='Not specified',url,publishedAt=null,sourceLabel='Official career page · discovered'}) {
  const cleanDescription=strip(description)||`${title} — official vacancy published by ${source.company}.`;
  return {id:String(id||url).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,180),title:strip(title),company:source.company,industry:source.industry,region:regionOf(location),location:strip(location)||'Not specified',format:format(`${location} ${cleanDescription.slice(0,800)}`),level:level(title),description:cleanDescription.slice(0,260),requirements:cleanDescription.slice(0,520),technologies:tech(`${title} ${cleanDescription}`),publishedAt,lastChecked:new Date().toISOString(),source:sourceLabel,url,status:'active',matchScore:score(title,cleanDescription,location)};
}

function discoveredJobs(html,pageUrl,source) {
  const rows=jsonLdJobs(html,source,pageUrl);
  const anchors=extractAnchors(html,pageUrl);
  for(const anchor of anchors){
    if(!isConcreteJobUrl(anchor.url,pageUrl)) continue;
    let title=anchor.text;
    if(!titleSignal.test(title)) title=headingBefore(html,anchor.index);
    if(!titleSignal.test(title)) continue;
    const nearby=strip(html.slice(Math.max(0,anchor.index-1500),Math.min(html.length,anchor.index+2500)));
    rows.push(toJob(source,{id:`career-${anchor.url}`,title,description:nearby,location:source.location||'Not specified',url:anchor.url}));
  }
  return [...new Map(rows.map(row=>[row.url,row])).values()];
}

function pageJobTitle(html) {
  const jsonTitles=[];
  for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try {
      const parsed=JSON.parse(match[1]);
      const queue=Array.isArray(parsed)?[...parsed]:[parsed];
      while(queue.length){
        const item=queue.shift();
        if(!item||typeof item!=='object') continue;
        if(Array.isArray(item)){queue.push(...item);continue;}
        if(item['@graph']) queue.push(...(Array.isArray(item['@graph'])?item['@graph']:[item['@graph']]));
        if(/JobPosting/i.test(String(item['@type']||''))) jsonTitles.push(strip(item.title||item.name));
      }
    } catch {}
  }
  const h1=strip(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');
  const og=strip(html.match(/<meta\b[^>]*(?:property|name)=["'](?:og:title|twitter:title)["'][^>]*content=["']([^"']+)["']/i)?.[1]||'');
  const title=strip(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'').split(/\s+[|–—-]\s+/)[0];
  return [...jsonTitles,h1,og,title].find(value=>titleSignal.test(value))||'';
}

async function verifyDiscoveredJobs(rows,source) {
  const verified=await mapWithConcurrency(rows.slice(0,40),4,async row=>{
    try {
      const page=await fetchText(row.url,{timeout:14000});
      const verifiedTitle=pageJobTitle(page.text);
      if(!verifiedTitle) return null;
      const description=strip(page.text).slice(0,4000);
      return toJob(source,{...row,id:row.id,title:verifiedTitle,description,url:page.url,sourceLabel:'Official career page · verified job'});
    } catch {
      return row;
    }
  });
  return verified.filter(Boolean);
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
    const leverHost=source.apiRegion==='eu'?'https://api.eu.lever.co':'https://api.lever.co';
    const rows=await fetchJSON(`${leverHost}/v0/postings/${source.token}?mode=json`);
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
  if(source.type==='workable') {
    const data=await fetchJSON(`https://apply.workable.com/api/v1/widget/accounts/${source.token}`);
    return (data.jobs||[]).map(j=>{
      const location=[j.city,j.region,j.country_name||j.country,j.remote?'Remote':null].filter(Boolean).join(', ')||'Not specified';
      const description=strip(`${j.department||''} ${j.description||''}`);
      return toJob(source,{id:`workable-${j.shortcode||j.id}`,title:j.title,description,location,url:j.url||`https://apply.workable.com/${source.token}/j/${j.shortcode}/`,publishedAt:j.published||null,sourceLabel:'Workable · official ATS'});
    });
  }
  if(source.type==='smartrecruiters') {
    const rows=[];
    for(const query of ['qa','quality','test']){
      const data=await fetchJSON(`https://api.smartrecruiters.com/v1/companies/${source.token}/postings?q=${encodeURIComponent(query)}&limit=100`);
      for(const j of data.content||[]){
        const location=[j.location?.city,j.location?.region,j.location?.country,j.location?.remote?'Remote':null].filter(Boolean).join(', ')||'Not specified';
        const description=strip(`${j.department?.label||''} ${j.function?.label||''} ${j.typeOfEmployment?.label||''}`);
        const slug=strip(j.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        rows.push(toJob(source,{id:`smartrecruiters-${j.id}`,title:j.name,description,location,url:`https://jobs.smartrecruiters.com/${source.token}/${j.id}-${slug}`,publishedAt:j.releasedDate||null,sourceLabel:'SmartRecruiters · official ATS'}));
      }
    }
    return [...new Map(rows.map(row=>[row.id,row])).values()];
  }
  if(source.type==='bamboohr') {
    const data=await fetchJSON(`https://${source.token}.bamboohr.com/careers/list`);
    return (data.result||[]).map(j=>{
      const location=[j.location?.city,j.location?.state,j.atsLocation?.city,j.atsLocation?.state,j.atsLocation?.country,j.isRemote?'Remote':null].filter(Boolean).join(', ')||'Not specified';
      const description=strip(`${j.departmentLabel||''} ${j.employmentStatusLabel||''} ${j.employmentType||''}`);
      return toJob(source,{id:`bamboohr-${source.token}-${j.id}`,title:j.jobOpeningName,description,location,url:`https://${source.token}.bamboohr.com/careers/${j.id}`,sourceLabel:'BambooHR · official ATS'});
    });
  }
  if(source.type==='deel') {
    const page=await fetchText(`https://jobs.deel.com/${source.token}`);
    const postings=[];
    for(const match of page.text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
      const script=match[1];
      if(!/self\.__next_f\.push/.test(script)||!/jobPostings/.test(script)) continue;
      try {
        const argument=script.match(/^self\.__next_f\.push\((.*)\)$/s)?.[1];
        if(!argument) continue;
        const frame=JSON.parse(argument);
        if(typeof frame?.[1]!=='string') continue;
        const payload=JSON.parse(frame[1].replace(/^[^:]+:/,''));
        if(Array.isArray(payload?.[3]?.jobPostings)) postings.push(...payload[3].jobPostings);
      } catch {}
    }
    return [...new Map(postings.map(j=>[j.id,j])).values()].map(j=>{
      const location=(j.job?.jobLocations||[]).map(item=>item.location?.name).filter(Boolean).join(' / ')||'Not specified';
      const details=[
        ...(j.job?.jobDepartments||[]).map(item=>item.department?.name),
        ...(j.job?.jobTeams||[]).map(item=>item.team?.name),
        ...(j.job?.jobEmploymentTypes||[]).map(item=>item.employmentType?.name)
      ].filter(Boolean).join(' · ');
      return toJob(source,{id:`deel-${source.token}-${j.id}`,title:j.title,description:details,location,url:`https://jobs.deel.com/${source.token}/job-details/${j.id}/overview`,publishedAt:j.updatedAt||j.createdAt||null,sourceLabel:'Deel · official ATS'});
    });
  }
  if(source.type==='workday') {
    const rows=[];
    for(const query of ['qa','quality','test']){
      let offset=0; let total=0;
      do {
        const endpoint=`https://${source.host}/wday/cxs/${source.tenant}/${source.site}/jobs`;
        const {text}=await fetchText(endpoint,{method:'POST',headers:{accept:'application/json','content-type':'application/json'},body:JSON.stringify({appliedFacets:{},limit:20,offset,searchText:query})});
        const data=JSON.parse(text); total=Number(data.total)||0;
        for(const j of data.jobPostings||[]){
          const location=strip(j.locationsText||j.location||source.location||'Not specified');
          const description=strip(`${j.bulletFields?.join(' ')||''} ${j.timeType||''}`);
          const url=normalizeUrl(j.externalPath,`https://${source.host}`);
          if(url) rows.push(toJob(source,{id:`workday-${source.tenant}-${j.externalPath}`,title:j.title,description,location,url,publishedAt:j.postedOn||null,sourceLabel:'Workday · official ATS'}));
        }
        offset+=20;
      } while(offset<total&&offset<200);
    }
    return [...new Map(rows.map(row=>[row.url,row])).values()];
  }
  if(source.type==='career') {
    const first=await fetchText(source.url);
    let rows=discoveredJobs(first.text,first.url,source);
    const anchors=extractAnchors(first.text,first.url);
    const candidates=anchors
      .filter(anchor=>listingSignal.test(`${anchor.text} ${anchor.url}`)&&(ctaSignal.test(anchor.text)||/jobs?|vacanc|positions?|openings?/i.test(anchor.url)))
      .filter(anchor=>normalizeUrl(anchor.url,first.url)!==first.url)
      .filter((anchor,index,list)=>list.findIndex(item=>item.url===anchor.url)===index)
      .slice(0,3);
    for(const candidate of candidates){
      try {
        const page=await fetchText(candidate.url,{timeout:15000});
        rows.push(...discoveredJobs(page.text,page.url,source));
      } catch {}
    }
    rows=[...new Map(rows.map(row=>[row.url,row])).values()];
    return verifyDiscoveredJobs(rows,source);
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
  const configuredCompanies=new Set(sources.map(source=>source.company.toLowerCase()));
  const careerSources=companies
    .filter(company=>!configuredCompanies.has(company.name.toLowerCase()))
    .map(company=>({type:'career',company:company.name,industry:company.industry,url:company.careerUrl,location:[company.city,company.country].filter(Boolean).join(', ')}));
  const effectiveSources=[...sources,...careerSources];

  // Источники независимы, но ограничиваем параллельность, чтобы не терять ответы из-за перегрузки соединений.
  const sourceResults=await mapWithConcurrency(effectiveSources,10,async source=>{
    try {
      const rows=await fetchSource(source);
      const accepted=rows.filter(j=>source.qaSpecialization
        ? j.specialization?.toLowerCase()===source.qaSpecialization.toLowerCase()
        : source.includeAllQuality
          ? qa.test(j.title)
        : qa.test(j.title)&&(explicitSoftwareQATitle.test(j.title)||softwareSignal.test(`${j.title} ${j.description} ${j.requirements}`)));
      return {source,rows,accepted};
    } catch(error) {
      return {source,error};
    }
  });

  for(const result of sourceResults){
    if(result.error){
      const cached=previousJobs.filter(job=>job.company.toLowerCase()===result.source.company.toLowerCase());
      all.push(...cached.map(job=>({...job,source:`${job.source.replace(/ · cached after temporary source error$/,'')} · cached after temporary source error`})));
      report.sources.push({...result.source,status:cached.length?'cached':'error',cached:cached.length,error:result.error.message});
      report.errors.push(`${result.source.company}: ${result.error.message}`);
      console.warn(`× ${result.source.company}: ${result.error.message}${cached.length?` · kept ${cached.length} verified vacancies from the previous snapshot`:''}`);
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

  let jobs=[...new Map(all.map(j=>[`${j.company}|${j.url||`${j.title}|${j.location}`}`.toLowerCase(),j])).values()]
    .map(job=>({...job,country:countryOf(`${job.location} ${job.url}`)}))
    .sort((a,b)=>(b.matchScore||0)-(a.matchScore||0));
  const coveredCompanies=report.sources.filter(x=>['ok','cached'].includes(x.status)).map(x=>x.company);

  if(checkCompanies){
    report.jobLinks=await mapWithConcurrency(jobs,12,async job=>({
      id:job.id,
      company:job.company,
      title:job.title,
      url:job.url,
      ...(await probeUrl(job.url))
    }));
    const inactiveLinks=new Set(report.jobLinks.filter(link=>link.status==='broken').map(link=>link.id));
    jobs=jobs.filter(job=>!inactiveLinks.has(job.id));
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
  }

  const validCareerLinks=checkCompanies?report.companies.filter(x=>['reachable','protected'].includes(x.status)).length:0;
  const validJobLinks=checkCompanies?report.jobLinks.filter(x=>['reachable','protected'].includes(x.status)).length:0;
  const companyStatus=checkCompanies?` Career URL: ${validCareerLinks}/${companies.length}. Vacancy URL: ${validJobLinks}/${jobs.length}.`:'';
  const meta={generatedAt:report.generatedAt,linkedinConnected,coveredCompanies,message:`Проверены официальные ATS и career-страницы: ${report.sources.filter(x=>x.status==='ok').length}/${effectiveSources.length}.${companyStatus} Ошибки не остановили остальные источники.`};
  return {jobs,linkedinJobs,meta,report};
}

if(process.argv[1]&&resolve(process.argv[1])===scriptPath){
  const result=await collectJobs({checkCompanies:true});
  await writeFile(resolve(root,'src/data/jobs.js'),`// Автоматически создано scripts/update-jobs.mjs\nexport const jobs = ${JSON.stringify(result.jobs,null,2)};\nexport const linkedinJobs = ${JSON.stringify(result.linkedinJobs,null,2)};\nexport const jobMeta = ${JSON.stringify(result.meta,null,2)};\n`);
  await writeFile(resolve(root,'update-report.json'),JSON.stringify(result.report,null,2));
  console.log(`\nГотово: ${result.jobs.length} активных QA-вакансий. LinkedIn API: ${result.meta.linkedinConnected?'подключён':'не подключён'}.`);
}
