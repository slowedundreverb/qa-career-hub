import { companies } from './data/companies.js';
import { jobs, linkedinJobs, jobMeta } from './data/jobs.js';
import { curriculum, tracks } from './data/curriculum.js';
import { questions } from './data/questions.js';

const app = document.querySelector('#app');
const saved = JSON.parse(localStorage.getItem('qa-hub-state') || '{}');
const storedCustomCompanies = JSON.parse(localStorage.getItem('qa-hub-custom-companies') || '[]');
const customCompanies = Array.isArray(storedCustomCompanies) ? storedCustomCompanies : [];
let companyWatchMessage = '';
let versionHistory = { repository: '', commits: [], loading: true };
const cachedJobs = JSON.parse(sessionStorage.getItem('qa-hub-jobs') || 'null');
if (cachedJobs?.jobs?.length && new Date(cachedJobs.meta?.generatedAt || 0) > new Date(jobMeta.generatedAt || 0)) {
  jobs.splice(0, jobs.length, ...cachedJobs.jobs);
  linkedinJobs.splice(0, linkedinJobs.length, ...(cachedJobs.linkedinJobs || []));
  Object.assign(jobMeta, cachedJobs.meta);
}
const modeFromHash = () => location.hash.includes('versions') ? 'versions' : location.hash.includes('learn') ? 'learn' : 'jobs';
const state = {
  mode: modeFromHash(),
  learnView: saved.learnView || 'roadmap',
  jobSearch: '', jobSearchDraft: '', type: 'all', industry: 'all', company: 'all', format: 'all', level: 'all', location: 'all', sort: 'fit', jobFiltersOpen: false,
  favoritesOnly: false,
  track: 'Все', theorySearch: '', theorySearchDraft: '', knowledgeCategory: 'Все', selectedTopic: null, quizCategory: saved.quizCategory || 'Все',
  completed: new Set(saved.completed || []),
  favorites: new Set(saved.favorites || []),
  quiz: saved.quiz?.set?.length === 10 ? saved.quiz : null,
  quizStats: saved.quizStats || { answered: 0, correct: 0 },
  settingsOpen: false
};

const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const navIcon = name => {
  const paths = {
    jobs: '<path d="M4 8h16v11H4z"/><path d="M9 8V5h6v3M4 12h16"/>',
    companies: '<path d="M5 20V5h10v15M15 10h4v10M8 8h4M8 12h4M8 16h4"/>',
    favorites: '<path d="M20.8 5.8a5.2 5.2 0 0 0-7.4 0L12 7.2l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 22l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z"/>',
    roadmap: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H8a4 4 0 0 0-4 4v0"/>',
    knowledge: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z"/>',
    quiz: '<path d="M4 4h16v12H9l-5 4V4Z"/><path d="m9 10 2 2 4-4"/>'
  };
  return `<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
};
const cleanJobText = (value='') => {
  const decoder=document.createElement('textarea');
  decoder.innerHTML=String(value);
  let text=decoder.value.replace(/<[^>]*>/g,' ');
  const hasMarkupDebris=/(?:^|\s)\/(?:p|div|span|strong|em|ul|ol|li|h[1-6]|section)(?=\s|$)|\b(?:class|data-[\w-]+|style|lang)\s*=/i.test(text);
  if(hasMarkupDebris){
    text=text
      .replace(/\b(?:class|data-[\w-]+|style|lang)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s]+)?/gi,' ')
      .replace(/(?:^|\s)\/?(?:p|div|span|strong|em|ul|ol|li|h[1-6]|section|br)(?=\s|$)/gi,' ')
      .replace(/\b(?:nbsp|quot)\b/gi,' ');
  }
  return text.replace(/\s+/g,' ').trim();
};
const initials = name => name.split(/\s+/).map(x => x[0]).join('').slice(0,2).toUpperCase();
const watchedCompanies = () => [...customCompanies, ...companies];
const companyKey = name => String(name).replace(/\.US$/,'').replace(/\s*\/\s*Gen Digital$/,'').trim().toLowerCase();
const saveCustomCompanies = () => localStorage.setItem('qa-hub-custom-companies', JSON.stringify(customCompanies));
const websiteName = url => {
  const hostname=new URL(url).hostname.replace(/^www\./,'');
  const stem=hostname.split('.')[0].replace(/[-_]+/g,' ');
  return stem.replace(/\b\w/g,char=>char.toUpperCase());
};
const normalizeWebsite = value => {
  const candidate=/^https?:\/\//i.test(value.trim())?value.trim():`https://${value.trim()}`;
  const url=new URL(candidate);
  if(!['http:','https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
  url.hash='';
  return url.href;
};
const date = value => value ? new Intl.DateTimeFormat('ru', { day:'2-digit', month:'short' }).format(new Date(value)) : '—';
const save = () => localStorage.setItem('qa-hub-state', JSON.stringify({
  completed:[...state.completed], favorites:[...state.favorites], quizStats: state.quizStats,
  quiz: state.quiz, quizCategory: state.quizCategory, learnView: state.learnView
}));
const shuffle = arr => [...arr].sort(() => Math.random() - .5);
const sourceWarning = count => count % 10 === 1 && count % 100 !== 11
  ? `${count} источник требует перепроверки`
  : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)
    ? `${count} источника требуют перепроверки`
    : `${count} источников требуют перепроверки`;

async function loadVersionHistory() {
  try {
    const response=await fetch('./versions.json',{cache:'no-store'});
    if(!response.ok) throw new Error('Version history unavailable');
    versionHistory={...(await response.json()),loading:false};
  } catch {
    versionHistory={repository:'https://github.com/slowedundreverb/qa-career-hub',commits:[],loading:false};
  }
  const versionButton=document.querySelector('.versions-button');
  const currentVersion=versionHistory.commits?.[0]?.version;
  if(versionButton&&currentVersion){
    versionButton.textContent=`v${currentVersion}`;
    versionButton.setAttribute('aria-label',`История версий, текущая версия v${currentVersion}`);
  }
  if(state.mode==='versions') renderVersions();
}

function shell(content) {
  state.settingsOpen=false;
  app.innerHTML = `
    <div class="ambient ambient-a"></div><div class="ambient ambient-b"></div>
    <header class="topbar">
      <a class="brand" href="#jobs" data-mode="jobs" aria-label="QA Career Hub">
        <span class="brand-mark">Q</span><span>QA<span class="brand-accent">/</span>HUB</span>
      </a>
      <nav class="mode-switch ${state.mode === 'learn' ? 'show-learn' : state.mode === 'jobs' ? 'show-jobs' : 'is-muted'}" aria-label="Главные разделы">
        <button class="mode-btn ${state.mode === 'jobs' ? 'active' : ''}" data-mode="jobs"><span>01</span> Вакансии</button>
        <button class="mode-btn ${state.mode === 'learn' ? 'active' : ''}" data-mode="learn"><span>02</span> Подготовка</button>
      </nav>
      <div class="settings-wrap">
        <a class="versions-button ${state.mode==='versions'?'active':''}" href="#versions" aria-label="История версий${versionHistory.commits?.[0]?.version?`, текущая версия v${versionHistory.commits[0].version}`:''}">${versionHistory.commits?.[0]?.version?`v${versionHistory.commits[0].version}`:'v…'}</a>
        <button class="settings-button" id="settings-button" aria-label="Настройки" aria-expanded="false" aria-controls="settings-menu">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/></svg>
        </button>
        <section class="settings-menu" id="settings-menu" aria-label="Меню настроек">
          <div class="settings-section">
            <span class="kicker">ОБУЧЕНИЕ</span><h3>Прогресс обучения</h3>
            <p>Автоматически сохраняется в этом браузере.</p>
            <div class="settings-progress"><span>${state.completed.size} / ${curriculum.length} тем</span><span>${state.quizStats.answered} ответов</span></div>
            <button class="settings-reset" id="reset-training-progress">Сбросить прогресс</button>
          </div>
          <div class="settings-section settings-vacancies" id="settings-vacancies">
            <span class="kicker">ВАКАНСИИ</span><h3>Актуальность вакансий</h3>
            <p id="settings-update-status">${jobMeta.generatedAt ? `Последняя проверка: ${date(jobMeta.generatedAt)}` : 'Данные ещё не проверялись'}</p>
            <button class="settings-refresh" id="settings-refresh-jobs">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7"/></svg>
              <span>Проверить актуальность</span>
            </button>
          </div>
        </section>
      </div>
    </header>
    ${content}
    <div id="toast" class="toast" role="status"></div>`;
  bindGlobal();
  bindMobileNavigation();
}

let mobileNavigationCleanup;

function bindMobileNavigation() {
  mobileNavigationCleanup?.();
  const banner=document.querySelector('.sidebar, .learn-sidebar');
  if(!banner) return;

  const topbar=document.querySelector('.topbar');
  const spacer=document.createElement('div');
  spacer.className='mobile-navigation-spacer';
  banner.after(spacer);

  let compact=false;
  let triggerY=0;
  let frame=0;
  let collapseTimer=0;
  let revealTimer=0;
  let expandTimer=0;
  let fullHeight=0;
  let hasScrolledAfterCollapse=false;
  let lastScrollY=window.scrollY;

  const compactHeight=()=>window.matchMedia('(max-width: 620px)').matches?84:88;

  const reset=()=>{
    compact=false;
    hasScrolledAfterCollapse=false;
    clearTimeout(collapseTimer);
    clearTimeout(revealTimer);
    clearTimeout(expandTimer);
    banner.classList.remove('is-collapsing','is-condensed','is-fixed');
    spacer.classList.remove('active');
    spacer.style.height='';
  };

  const measure=()=>{
    if(compact||!window.matchMedia('(max-width: 900px)').matches) return;
    const topbarHeight=topbar?.getBoundingClientRect().height||0;
    triggerY=window.scrollY+banner.getBoundingClientRect().top-topbarHeight+14;
  };

  const setCompact=next=>{
    if(next===compact) return;
    compact=next;
    clearTimeout(collapseTimer);
    clearTimeout(revealTimer);
    clearTimeout(expandTimer);
    if(next){
      hasScrolledAfterCollapse=false;
      fullHeight=banner.getBoundingClientRect().height;
      spacer.style.height=`${fullHeight}px`;
      banner.classList.add('is-fixed');
      spacer.classList.add('active');
      requestAnimationFrame(()=>{
        banner.classList.add('is-collapsing');
        collapseTimer=window.setTimeout(()=>{
          if(!compact) return;
          banner.classList.add('is-condensed');
          spacer.style.height=`${compactHeight()}px`;
        },220);
      });
      return;
    }
    spacer.style.height=`${fullHeight}px`;
    banner.classList.remove('is-condensed');
    revealTimer=window.setTimeout(()=>{
      if(compact) return;
      banner.classList.remove('is-collapsing');
    },260);
    expandTimer=window.setTimeout(()=>{
      if(compact) return;
      banner.classList.remove('is-fixed');
      spacer.classList.remove('active');
      spacer.style.height='';
      measure();
    },460);
  };

  const update=()=>{
    frame=0;
    const mobile=window.matchMedia('(max-width: 900px)').matches;
    if(!mobile){
      reset();
      return;
    }
    const currentScrollY=window.scrollY;
    if(!compact){
      if(currentScrollY>triggerY) setCompact(true);
    }else{
      if(currentScrollY>triggerY+8) hasScrolledAfterCollapse=true;
      const movingUp=currentScrollY<lastScrollY-1;
      if(hasScrolledAfterCollapse&&movingUp&&currentScrollY<=triggerY) setCompact(false);
    }
    lastScrollY=currentScrollY;
  };

  const scheduleUpdate=()=>{
    if(frame) return;
    frame=requestAnimationFrame(update);
  };

  const resize=()=>{
    if(!compact) measure();
    scheduleUpdate();
  };

  measure();
  update();
  window.addEventListener('scroll',scheduleUpdate,{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  mobileNavigationCleanup=()=>{
    cancelAnimationFrame(frame);
    clearTimeout(collapseTimer);
    clearTimeout(revealTimer);
    clearTimeout(expandTimer);
    window.removeEventListener('scroll',scheduleUpdate);
    window.removeEventListener('resize',resize);
    spacer.remove();
  };
}

function bindGlobal() {
  document.querySelectorAll('[data-mode]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    const targetMode=el.dataset.mode;
    if(targetMode===state.mode) return;
    const switcher=document.querySelector('.mode-switch');
    const animated=['jobs','learn'].includes(targetMode);
    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(animated&&switcher){
      switcher.classList.remove('show-jobs','show-learn','is-muted');
      switcher.classList.add(targetMode==='learn'?'show-learn':'show-jobs','switching');
      document.querySelectorAll('.mode-btn').forEach(button=>button.classList.toggle('active',button.dataset.mode===targetMode));
    }
    window.setTimeout(()=>{
      state.mode=targetMode;
      state.selectedTopic=null;
      location.hash=targetMode;
    },animated&&!reduceMotion?300:0);
  }));
  const settingsButton=document.querySelector('#settings-button');
  const settingsMenu=document.querySelector('#settings-menu');
  settingsButton?.addEventListener('click',e=>{
    e.stopPropagation();
    state.settingsOpen=!state.settingsOpen;
    settingsMenu?.classList.toggle('open',state.settingsOpen);
    settingsButton.setAttribute('aria-expanded',String(state.settingsOpen));
  });
  document.querySelector('#reset-training-progress')?.addEventListener('click',resetTrainingProgress);
  document.querySelector('#settings-refresh-jobs')?.addEventListener('click',refreshJobs);
}

document.addEventListener('click',e=>{
  if(state.settingsOpen&&!e.target.closest('.settings-wrap')){
    state.settingsOpen=false;
    document.querySelector('#settings-menu')?.classList.remove('open');
    document.querySelector('#settings-button')?.setAttribute('aria-expanded','false');
  }
});

function resetTrainingProgress(){
  if(!confirm('Сбросить пройденные темы, текущую сессию и статистику тренажёра?')) return;
  state.completed.clear();
  state.quizStats={answered:0,correct:0};
  state.quiz=null;
  state.quizCategory='Все';
  state.learnView='roadmap';
  state.settingsOpen=false;
  save();
  render();
  toast('Учебный прогресс сброшен');
}

function jobType(j) {
  const v = `${j.title} ${(j.technologies || []).join(' ')}`.toLowerCase();
  if (v.includes('sdet')) return 'sdet';
  if (v.includes('java')) return 'java';
  if (v.includes('automat')) return 'aqa';
  return 'manual';
}

function filteredJobs() {
  return jobs.filter(j => {
    const hay = `${j.title} ${j.company} ${j.industry||''} ${j.location} ${(j.technologies || []).join(' ')}`.toLowerCase();
    const country = state.location.startsWith('country:') ? state.location.slice(8) : '';
    const europeRemote = j.format === 'Remote' && /europe|global|worldwide|anywhere/i.test(j.location);
    return (!state.favoritesOnly || state.favorites.has(j.id)) &&
      (!state.jobSearch || hay.includes(state.jobSearch.toLowerCase())) &&
      (state.type === 'all' || jobType(j) === state.type) &&
      (state.industry === 'all' || (state.industry === 'fintech' ? /fintech|bank|payment|financial|trading|mortgage|insurtech/i.test(j.industry||'') : j.industry === state.industry)) &&
      (state.company === 'all' || companyKey(j.company) === companyKey(state.company)) &&
      (state.format === 'all' || j.format === state.format) &&
      (state.level === 'all' || j.level === state.level) &&
      (state.location === 'all' || j.region?.toLowerCase() === state.location || (state.location === 'remote' && j.format === 'Remote') || (country && (j.location.toLowerCase().includes(country) || europeRemote))) &&
      j.status !== 'closed';
  }).sort((a,b) => state.sort === 'fit' ? (b.matchScore||0)-(a.matchScore||0) : new Date(b.lastChecked||0)-new Date(a.lastChecked||0));
}

function renderJobs() {
  const list = filteredJobs();
  const active = jobs.filter(j => j.status === 'active').length;
  const watchlist=watchedCompanies();
  const cyprus = jobs.filter(j => /cyprus|limassol|nicosia/i.test(j.location)).length;
  const industries=[...new Set(jobs.map(j=>j.industry||'Technology'))].sort((a,b)=>a.localeCompare(b));
  const regions=[...new Set(jobs.map(j=>j.region||'Other'))].sort((a,b)=>a.localeCompare(b));
  const employers=[...new Set(watchlist.map(company=>company.name))].sort((a,b)=>a.localeCompare(b));
  const employerCounts=jobs.filter(job=>job.status!=='closed').reduce((counts,job)=>{
    const key=companyKey(job.company);
    counts.set(key,(counts.get(key)||0)+1);
    return counts;
  },new Map());
  const coveredEmployers=new Set((jobMeta.coveredCompanies||[]).map(companyKey));
  const activeFilterCount=[state.industry,state.location,state.company,state.type,state.level,state.format].filter(value=>value!=='all').length;
  const employerOptions=employers.map(name=>{
    const count=employerCounts.get(companyKey(name))||0;
    const checked=coveredEmployers.has(companyKey(name));
    return [name,count?`${name} · ${count}`:checked?`${name} · 0 QA-вакансий`:`${name} · только career-ссылка`,count===0];
  });
  const focusCountries=['Germany','Spain','Netherlands','Italy','France','Ireland'];
  shell(`<main class="jobs-layout">
    <aside class="sidebar">
      <div class="eyebrow">CAREER CONTROL</div>
      <h1>Найдите роль,<br><em>подходящую вам.</em></h1>
      <p class="lead">Международные QA-вакансии с официальных страниц работодателей.</p>
      <div class="side-nav">
        <button id="show-all-jobs" class="${state.favoritesOnly?'':'active'}"><span>${navIcon('jobs')}</span> Найденные вакансии <b>${active}</b></button>
        <button id="show-companies"><span>${navIcon('companies')}</span> Компании <b>${watchlist.length}</b></button>
        <button id="show-favorites" class="${state.favoritesOnly?'active':''}"><span>${navIcon('favorites')}</span> Сохранённые <b>${state.favorites.size}</b></button>
      </div>
      <div class="update-box about-box"><button id="show-about" aria-label="Открыть информацию о проекте">${navIcon('knowledge')}<span>О проекте</span></button></div>
    </aside>
    <section class="jobs-main">
      <div class="jobs-hero">
        <div><div class="eyebrow">${new Date().toLocaleDateString('ru',{weekday:'long',day:'numeric',month:'long'})}</div><h2>Подходящие вакансии</h2><p>${active ? `Есть ${active} активных позиций, ${cyprus} — с фокусом на Кипр.` : 'Запустите обновление, чтобы наполнить агрегатор официальными вакансиями.'}</p></div>
        <div class="hero-stats"><div><strong>${active}</strong><span>активных</span></div><div><strong>${watchlist.length}</strong><span>компаний</span></div><div><strong>${state.favorites.size}</strong><span>сохранено</span></div></div>
      </div>
      ${linkedinBlock()}
      <div class="filterbar ${state.jobFiltersOpen?'filters-open':''}">
        <form class="search job-search-form" id="job-search-form">
          <input id="job-search" value="${esc(state.jobSearchDraft)}" placeholder="Должность, компания или технология" aria-label="Поиск вакансий" />
          <button class="job-search-button" type="submit" aria-label="Выполнить поиск" title="Выполнить поиск">⌕</button>
        </form>
        <button class="mobile-filter-toggle" id="mobile-filter-toggle" type="button" aria-expanded="${state.jobFiltersOpen}" aria-controls="job-filter-options"><span>${state.jobFiltersOpen?'Скрыть':'Фильтры'}</span>${activeFilterCount?`<b>${activeFilterCount}</b>`:''}</button>
        <div class="filter-options" id="job-filter-options">
          ${select('job-industry',[['all','Все отрасли'],['fintech','Fintech / банки'],...industries.map(x=>[x,x])],state.industry)}
          ${select('job-location',[['all','Вся география'],['remote','Только remote'],...focusCountries.map(x=>[`country:${x.toLowerCase()}`,`${x} + remote EU`]),...regions.map(x=>[x.toLowerCase(),x])],state.location)}
          ${select('job-company',[['all',`Все компании · ${employers.length}`],...employerOptions],state.company)}
          ${select('job-type',[['all','Все роли'],['manual','Manual QA'],['aqa','Automation'],['java','Java AQA'],['sdet','SDET']],state.type)}
          ${select('job-level',[['all','Любой уровень'],['Junior','Junior'],['Middle','Middle'],['Senior','Senior'],['Lead','Lead']],state.level)}
          ${select('job-format',[['all','Любой формат'],['Remote','Remote'],['Hybrid','Hybrid'],['On-site','Офис']],state.format)}
          ${select('job-sort',[['updated','Сначала свежие'],['fit','По совпадению']],state.sort)}
        </div>
      </div>
      <div class="results-head"><span><b>${list.length}</b> вакансий после фильтрации</span><small>Только официальные страницы работодателей</small></div>
      <div class="jobs-list">${list.length ? list.map(jobCard).join('') : emptyJobs()}</div>
    </section>
  </main>${companiesDrawer()}${aboutDialog()}`);
  bindJobs();
}

const select = (id, opts, current) => `<label class="select-wrap"><select id="${id}">${opts.map(([v,l,disabled])=>`<option value="${esc(v)}" ${v===current?'selected':''} ${disabled?'disabled':''}>${esc(l)}</option>`).join('')}</select><span>⌄</span></label>`;

function linkedinBlock() {
  if (!jobMeta.linkedinConnected) return `<section class="linkedin-panel disconnected">
    <div class="li-icon">in</div><div class="li-copy"><div><span class="kicker">LINKEDIN RADAR</span><h3>10 свежих QA-вакансий</h3></div><p>Интеграция не подключена — мы не подменяем реальные данные демонстрационными.</p></div>
    <a href="https://www.linkedin.com/jobs/search/?keywords=QA%20Engineer&location=Cyprus&f_TPR=r604800" target="_blank" rel="noreferrer">Открыть поиск <span>↗</span></a>
  </section>`;
  return `<section class="linkedin-panel"><div class="li-icon">in</div><div class="li-copy"><span class="kicker">LINKEDIN RADAR</span><h3>10 свежих QA-вакансий</h3><p>${linkedinJobs.length} получено через настроенный API</p></div><div class="fresh-strip">${linkedinJobs.slice(0,10).map(j=>`<a href="${esc(j.url)}" target="_blank"><b>${esc(j.title)}</b><span>${esc(j.company)} · ${esc(j.location)}</span></a>`).join('')}</div></section>`;
}

function jobCard(j) {
  const fav = state.favorites.has(j.id);
  return `<article class="job-card">
    <div class="company-logo" style="--h:${(j.company.length*31)%360}">${esc(initials(j.company))}</div>
    <div class="job-content"><div class="job-title-row"><div><span class="fit ${j.matchScore>=85?'great':''}">${j.matchScore||70}% совпадение</span><h3>${esc(j.title)}</h3></div><button class="save ${fav?'saved':''}" data-favorite="${esc(j.id)}" aria-label="Сохранить">${fav?'♥':'♡'}</button></div>
      <div class="job-company"><b>${esc(j.company)}</b><span>·</span><span>${esc(j.location)}</span></div>
      <p>${esc(cleanJobText(j.description) || 'Описание и требования доступны на официальной странице работодателя.')}</p>
      <div class="tag-cloud job-tags">${(j.technologies||[]).slice(0,6).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
      <div class="job-meta"><span>${esc(j.industry||'Technology')}</span><span>${esc(j.region||'Global')}</span><span>${j.format||'Не указан'}</span><span>${j.level||'Уровень не указан'}</span><span>проверено ${date(j.lastChecked)}</span><span class="status-dot">${j.status==='active'?'активна':'перепроверить'}</span></div>
    </div>
    <a class="apply" href="${esc(j.url)}" target="_blank" rel="noreferrer">Официальная вакансия <span>↗</span></a>
  </article>`;
}

const emptyJobs = () => `<div class="empty-state"><h3>${jobs.length ? 'Ничего не найдено' : 'Данные вакансий ещё не обновлены'}</h3><p>${jobs.length ? 'Измените фильтры или поисковый запрос.' : 'В терминале проекта выполните npm run update:jobs. Каждый источник проверяется независимо.'}</p>${jobs.length?'<button id="reset-filters">Сбросить фильтры</button>':''}</div>`;

function aboutDialog() {
  return `<dialog id="about-dialog" class="about-dialog">
    <div class="dialog-head"><div><span class="eyebrow">ABOUT QA/HUB</span><h2>Карьерный центр для QA</h2><p>Один интерфейс для поиска следующей роли и системной подготовки к интервью.</p></div><button id="close-about" aria-label="Закрыть информацию о проекте">×</button></div>
    <div class="about-features">
      <article><span>01</span><h3>Искать вакансии</h3><p>Фильтровать международные QA-позиции и переходить только на официальные страницы работодателей.</p></article>
      <article><span>02</span><h3>Следить за компаниями</h3><p>Сохранять карьерные сайты интересных компаний и возвращаться к ним из личного watchlist.</p></article>
      <article><span>03</span><h3>Готовиться к интервью</h3><p>Проходить маршрут тем, повторять базу знаний и тренироваться на вопросах с объяснениями.</p></article>
    </div>
    <footer class="about-author"><span class="about-avatar">ГП</span><div><small>СОЗДАТЕЛЬ ПРОЕКТА</small><strong>Глеб Провоторов</strong><p>QA Engineer · идея, продукт и развитие QA Career Hub</p></div></footer>
  </dialog>`;
}

function companiesDrawer() {
  const watchlist=watchedCompanies();
  const companyCounts=jobs.filter(job=>job.status!=='closed').reduce((counts,job)=>{
    const key=companyKey(job.company);
    counts.set(key,(counts.get(key)||0)+1);
    return counts;
  },new Map());
  const coveredEmployers=new Set((jobMeta.coveredCompanies||[]).map(companyKey));
  const card=(c,isCustom=false)=>`<article class="company-entry ${isCustom?'custom':''}">
    <a href="${esc(c.careerUrl)}" target="_blank" rel="noreferrer">
      <span class="company-logo small">${esc(initials(c.name))}</span>
      <div><b>${esc(c.name)}</b><small>${isCustom?'Добавлено вами':`${esc(c.city)} · ${esc(c.industry)}`}</small></div><i>${isCustom?'Ваш список':c.priority==='high'?'Кипр':'↗'}</i>
      ${isCustom?'':`<em>${companyCounts.get(companyKey(c.name))||0}${coveredEmployers.has(companyKey(c.name))?' QA':' · ссылка'}</em>`}
    </a>
    ${isCustom?`<button type="button" data-remove-company="${esc(c.id)}" aria-label="Удалить ${esc(c.name)} из отслеживания">×</button>`:''}
  </article>`;
  return `<dialog id="companies-dialog">
    <div class="dialog-head"><div><span class="eyebrow">WATCHLIST</span><h2>${watchlist.length} компаний под наблюдением</h2><p>Официальные career-страницы и сайты, которые вы добавили самостоятельно.</p></div><button id="close-dialog" aria-label="Закрыть список компаний">×</button></div>
    <div class="companies-dialog-body" role="region" aria-label="Список компаний" tabindex="0">
      <form class="company-watch-form" id="company-watch-form">
        <div><span class="kicker">СВОЙ ИСТОЧНИК</span><b>Добавить сайт для отслеживания</b></div>
        <label><span>Название — необязательно</span><input id="company-watch-name" autocomplete="organization" placeholder="Например, Acme Bank"></label>
        <label><span>Ссылка на вакансии</span><input id="company-watch-url" type="text" inputmode="url" autocomplete="url" required placeholder="careers.company.com"></label>
        <button type="submit">Добавить</button>
        <p class="company-watch-message" id="company-watch-message" role="status">${esc(companyWatchMessage)}</p>
      </form>
      <div class="company-grid">${customCompanies.map(c=>card(c,true)).join('')}${companies.map(c=>card(c)).join('')}</div>
    </div>
  </dialog>`;
}

function addWatchedCompany(event){
  event.preventDefault();
  const nameInput=document.querySelector('#company-watch-name');
  const urlInput=document.querySelector('#company-watch-url');
  try{
    const careerUrl=normalizeWebsite(urlInput?.value||'');
    const duplicate=watchedCompanies().some(company=>{
      try{return normalizeWebsite(company.careerUrl).replace(/\/$/,'')===careerUrl.replace(/\/$/,'');}
      catch{return false;}
    });
    if(duplicate){
      const feedback=document.querySelector('#company-watch-message');
      if(feedback){feedback.textContent='Этот сайт уже есть в списке';feedback.classList.add('error');}
      urlInput?.focus();
      return;
    }
    const name=(nameInput?.value||'').trim()||websiteName(careerUrl);
    customCompanies.unshift({id:`custom-${Date.now()}`,name,careerUrl,country:'Custom',city:'Ваш источник',industry:'Отслеживание',priority:'normal',status:'monitoring'});
    saveCustomCompanies();
    companyWatchMessage=`${name} добавлен в отслеживание`;
    renderJobs();
    document.querySelector('#companies-dialog')?.showModal();
  }catch{
    const feedback=document.querySelector('#company-watch-message');
    if(feedback){feedback.textContent='Введите корректную ссылку на сайт';feedback.classList.add('error');}
    urlInput?.focus();
  }
}

function removeWatchedCompany(id){
  const index=customCompanies.findIndex(company=>company.id===id);
  if(index<0) return;
  const [removed]=customCompanies.splice(index,1);
  if(state.company===removed.name) state.company='all';
  saveCustomCompanies();
  companyWatchMessage=`${removed.name} удалён из отслеживания`;
  renderJobs();
  document.querySelector('#companies-dialog')?.showModal();
}

function bindJobs() {
  const rerenderWith = (key, value) => { state[key] = value; renderJobs(); };
  document.querySelector('#job-search')?.addEventListener('input',e=>{state.jobSearchDraft=e.target.value;});
  document.querySelector('#job-search-form')?.addEventListener('submit',e=>{
    e.preventDefault();
    state.jobSearch=state.jobSearchDraft.trim();
    renderJobs();
  });
  document.querySelector('#mobile-filter-toggle')?.addEventListener('click',()=>{state.jobFiltersOpen=!state.jobFiltersOpen;renderJobs();});
  [['job-type','type'],['job-industry','industry'],['job-company','company'],['job-location','location'],['job-level','level'],['job-format','format'],['job-sort','sort']].forEach(([id,key])=>document.querySelector(`#${id}`)?.addEventListener('change',e=>rerenderWith(key,e.target.value)));
  document.querySelectorAll('[data-favorite]').forEach(b=>b.addEventListener('click',()=>{ state.favorites.has(b.dataset.favorite)?state.favorites.delete(b.dataset.favorite):state.favorites.add(b.dataset.favorite); save(); renderJobs(); }));
  document.querySelector('#reset-filters')?.addEventListener('click',()=>{Object.assign(state,{jobSearch:'',jobSearchDraft:'',type:'all',industry:'all',company:'all',format:'all',level:'all',location:'all'});renderJobs();});
  const dialog=document.querySelector('#companies-dialog'); document.querySelector('#show-companies')?.addEventListener('click',()=>dialog.showModal()); document.querySelector('#close-dialog')?.addEventListener('click',()=>dialog.close());
  const about=document.querySelector('#about-dialog');
  const switcher=document.querySelector('.mode-switch');
  const muteSwitcher=()=>switcher?.classList.add('is-muted');
  const restoreSwitcher=()=>switcher?.classList.remove('is-muted');
  document.querySelector('#show-about')?.addEventListener('click',()=>{muteSwitcher();about.showModal();});
  document.querySelector('#close-about')?.addEventListener('click',()=>about.close());
  about?.addEventListener('close',restoreSwitcher);
  const companyScroll=document.querySelector('.companies-dialog-body');
  companyScroll?.addEventListener('keydown',e=>{
    const destinations={
      PageDown:companyScroll.scrollTop+companyScroll.clientHeight*.85,
      PageUp:companyScroll.scrollTop-companyScroll.clientHeight*.85,
      Home:0,
      End:companyScroll.scrollHeight
    };
    if(!(e.key in destinations)) return;
    e.preventDefault();
    companyScroll.scrollTo({top:destinations[e.key],behavior:'smooth'});
  });
  document.querySelector('#company-watch-form')?.addEventListener('submit',addWatchedCompany);
  document.querySelectorAll('[data-remove-company]').forEach(button=>button.addEventListener('click',()=>removeWatchedCompany(button.dataset.removeCompany)));
  document.querySelector('#show-all-jobs')?.addEventListener('click',()=>{state.favoritesOnly=false;renderJobs();});
  document.querySelector('#show-favorites')?.addEventListener('click',()=>{state.favoritesOnly=true;state.jobSearch='';state.jobSearchDraft='';renderJobs();});
}

async function refreshJobs(){
  const panel=document.querySelector('#settings-vacancies');
  const button=document.querySelector('#settings-refresh-jobs');
  const status=document.querySelector('#settings-update-status');
  if(!panel||!button||!status) return;
  panel.classList.add('refreshing'); button.disabled=true; status.textContent='Проверяем официальные источники…';
  try{
    const response=await fetch('/api/refresh-jobs',{method:'POST'});
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error||'Refresh unavailable');
    if(!Array.isArray(result.jobs)) throw new Error('Invalid refresh response');
    jobs.splice(0,jobs.length,...result.jobs);
    linkedinJobs.splice(0,linkedinJobs.length,...(result.linkedinJobs||[]));
    Object.assign(jobMeta,result.meta||{generatedAt:new Date().toISOString()});
    sessionStorage.setItem('qa-hub-jobs',JSON.stringify({jobs:result.jobs,linkedinJobs:result.linkedinJobs||[],meta:jobMeta}));
    state.settingsOpen=false;
    render();
    toast(`Готово: ${result.count} активных вакансий${result.warnings?` · ${sourceWarning(result.warnings)}`:''}`);
  }catch(error){
    console.error('Job refresh failed',error);
    panel.classList.remove('refreshing'); button.disabled=false; status.textContent='Не удалось проверить данные';
    toast('Не удалось обновить вакансии. Попробуйте ещё раз позже');
  }
}

const versionNotes = {
  aeee763: 'Created the first QA Career Hub with international vacancies and interview preparation.',
  '38fadf8': 'Expanded the European vacancy collection and fixed saved job behavior.',
  '0cae886': 'Configured the correct production output directory for Vercel.',
  '310311a': 'Excluded local Vercel environment files from the repository.',
  '89d73bd': 'Added responsive layouts for mobile devices and compact windows.',
  '6067610': 'Enabled live vacancy refresh from the published application.',
  '3095560': 'Restored the segmented circular learning progress indicator.',
  '685222b': 'Fixed the topic completion control and its position inside the study notes.',
  '72735fc': 'Added new career sites and a personal company watchlist.',
  'a01dc24': 'Restored scrolling in the company directory and added a visible scrollbar.',
  '301fdd6': 'Fixed company scrolling, explicit search submission, complete company filters, and commit-based version history.',
  f36134a: 'Replaced the Versions label with the public version number and removed repository links.'
};

const versionTitles = {
  f36134a: 'Show public version without commit links'
};

function renderVersions() {
  const commits=versionHistory.commits||[];
  const cards=commits.map((commit,index)=>{
    const note=versionNotes[commit.shortSha]||commit.message;
    const title=versionTitles[commit.shortSha]||commit.message;
    const formattedDate=new Intl.DateTimeFormat('ru',{day:'numeric',month:'long',year:'numeric'}).format(new Date(commit.date));
    return `<article class="version-card ${index===0?'current':''}">
      <div class="version-rail"><span></span><i></i></div>
      <div class="version-content">
        <div class="version-meta"><b>v${esc(commit.version)}</b>${index===0?'<em>Текущая версия</em>':''}<time datetime="${esc(commit.date)}">${esc(formattedDate)}</time></div>
        <h2>${esc(title)}</h2>
        <p>${esc(note)}</p>
      </div>
    </article>`;
  }).join('');
  shell(`<main class="versions-page">
    <section class="versions-hero">
      <a href="#${state.mode==='versions'?'jobs':state.mode}" class="versions-back">← Вернуться к сайту</a>
      <span class="eyebrow">CHANGELOG</span>
      <h1>История версий</h1>
      <p>Каждый релиз связан с реальным Git-коммитом. Здесь видно, что менялось от первой версии до текущей.</p>
      <div class="versions-summary"><strong>${commits.length}</strong><span>версий опубликовано</span></div>
    </section>
    <section class="versions-list">
      ${versionHistory.loading?'<div class="version-empty">Загружаем историю обновлений…</div>':cards||'<div class="version-empty">История коммитов пока недоступна.</div>'}
    </section>
  </main>`);
}

function renderLearn() {
  const done = state.completed.size;
  const pct = Math.round(done / curriculum.length * 100);
  shell(`<main class="learn-shell">
    <aside class="learn-sidebar">
      <div class="eyebrow">INTERVIEW LAB</div><h1><span>Готовьтесь.</span><em>Практикуйтесь.</em><span>Отвечайте.</span></h1>
      <div class="progress-ring" style="--p:${pct}"><div><strong>${pct}%</strong><span>курса</span></div></div>
      <nav class="learn-nav">
        <button data-learn="roadmap" class="${state.learnView==='roadmap'?'active':''}"><span>${navIcon('roadmap')}</span><div><b>План подготовки</b><small>${curriculum.length} тем</small></div></button>
        <button data-learn="theory" class="${state.learnView==='theory'?'active':''}"><span>${navIcon('knowledge')}</span><div><b>База знаний</b><small>теория и практика</small></div></button>
        <button data-learn="quiz" class="${state.learnView==='quiz'?'active':''}"><span>${navIcon('quiz')}</span><div><b>Тренажёр</b><small>${questions.length} вопросов</small></div></button>
      </nav>
    </aside>
    <section class="learn-main">${state.learnView==='quiz'?quizView():state.learnView==='theory'?knowledgeView():theoryView(true)}</section>
  </main>`);
  bindLearn();
}

function theoryView(roadmap=false) {
  const filtered = curriculum.filter(t => (state.track==='Все'||t.track===state.track) && `${t.title} ${t.summary} ${t.theory}`.toLowerCase().includes(state.theorySearch.toLowerCase()));
  return `<div class="learn-head"><div><span class="eyebrow">${roadmap?'ПЛАН ПОДГОТОВКИ':'БАЗА ЗНАНИЙ'}</span><h2>${roadmap?'QA-интервью: от основ к практике':'Коротко. По делу. Для интервью.'}</h2><p>${roadmap?'Повторяйте ключевые темы, закрепляйте знания и выбирайте собственную траекторию.':'Ищите по теме, фильтруйте трек и отмечайте пройденное.'}</p></div><div class="streak"><span>◆</span><div><b>${state.completed.size} / ${curriculum.length}</b><small>тем завершено</small></div></div></div>
  <div class="theory-tools"><form class="search learn-search-form"><input id="theory-search" value="${esc(state.theorySearchDraft)}" placeholder="Найти определение или тему" aria-label="Поиск по плану подготовки" /><button class="learn-search-button" type="submit" aria-label="Выполнить поиск" title="Выполнить поиск">⌕</button></form><div class="track-tabs">${tracks.map(t=>`<button data-track="${t}" class="${state.track===t?'active':''}">${t}</button>`).join('')}</div></div>
  <div class="topic-grid">${filtered.map((t,i)=>topicCard(t,i,roadmap)).join('')}</div>${!filtered.length?'<div class="empty-state"><h3>Темы не найдены</h3><p>Измените запрос или выберите другой трек.</p></div>':''}
  ${state.selectedTopic?topicModal(curriculum.find(t=>t.id===state.selectedTopic)):''}`;
}

function knowledgeView() {
  const baseQuestions=questions.slice(0,Math.floor(questions.length/2));
  const categories=['Все',...new Set(baseQuestions.map(q=>q.category))];
  const query=state.theorySearch.toLowerCase();
  const filtered=baseQuestions.filter(q=>(state.knowledgeCategory==='Все'||q.category===state.knowledgeCategory)&&`${q.prompt} ${q.answer} ${q.explanation}`.toLowerCase().includes(query));
  const resources=[
    ['QA Core','ISTQB Foundation Level','Силлабус, glossary и sample exams','https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/'],
    ['Web','MDN: HTTP','Методы, статусы, заголовки и кеширование','https://developer.mozilla.org/en-US/docs/Web/HTTP'],
    ['Security','OWASP Testing Guide','Практическая методология web security testing','https://owasp.org/www-project-web-security-testing-guide/'],
    ['API','Postman Docs','Скрипты проверок и автоматизация коллекций','https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-scripts/'],
    ['Java','Oracle: BigDecimal','Точность, scale и правила округления','https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html'],
    ['Automation','Selenium Docs','WebDriver, ожидания и тестовые практики','https://www.selenium.dev/documentation/'],
    ['Integration','Testcontainers for Java','Реальные зависимости в integration tests','https://java.testcontainers.org/'],
    ['Data','PostgreSQL Tutorial','SQL, joins, transactions и aggregates','https://www.postgresql.org/docs/current/tutorial-sql.html']
  ];
  return `<div class="learn-head knowledge-head"><div><span class="eyebrow">БАЗА ЗНАНИЙ</span><h2>Вопрос. Ответ. Почему.</h2><p>${baseQuestions.length} коротких разборов для повторения перед интервью.</p></div></div>
    <div class="knowledge-tools"><form class="search learn-search-form"><input id="knowledge-search" value="${esc(state.theorySearchDraft)}" placeholder="Найти вопрос, термин или ответ" aria-label="Поиск по базе знаний" /><button class="learn-search-button" type="submit" aria-label="Выполнить поиск" title="Выполнить поиск">⌕</button></form><div class="knowledge-tabs">${categories.map(c=>`<button data-knowledge-category="${c}" class="${state.knowledgeCategory===c?'active':''}">${c}</button>`).join('')}</div></div>
    <div class="knowledge-layout"><section class="knowledge-list">${filtered.map((q,i)=>`<details class="knowledge-card" ${i===0?'open':''}><summary><span>${String(i+1).padStart(2,'0')}</span><div><small>${q.category}</small><h3>${q.prompt}</h3></div><b>+</b></summary><div class="knowledge-answer"><section><span>Короткий ответ</span><p>${q.answer}</p></section><section><span>Почему так</span><p>${q.explanation}</p></section></div></details>`).join('')||'<div class="empty-state"><h3>Ничего не найдено</h3><p>Измените запрос или категорию.</p></div>'}</section>
    <aside class="resource-panel"><span class="kicker">ПОЛЕЗНО ПОЧИТАТЬ</span><h3>Официальные источники</h3><div class="resource-list">${resources.map(([tag,title,description,url])=>`<a href="${url}" target="_blank" rel="noreferrer"><small>${tag}</small><b>${title}</b><span>${description}</span><i>↗</i></a>`).join('')}</div></aside></div>`;
}

function topicCard(t,i,roadmap) {
  const done=state.completed.has(t.id);
  return `<article class="topic-card ${done?'done':''}" data-topic="${t.id}"><div class="topic-num">${String(i+1).padStart(2,'0')}</div><div class="topic-body"><div class="topic-top"><span class="track">${t.track}</span><span>${t.duration} мин</span></div><h3>${t.title}</h3><p>${t.summary}</p><div class="topic-footer"><span>${done?'✓ Пройдено':'Открыть конспект'}</span><b>→</b></div></div></article>`;
}

function topicModal(t) {
  if(!t) return '';
  const complete=state.completed.has(t.id);
  return `<div class="topic-overlay" id="topic-overlay"><section class="topic-modal" role="dialog" aria-modal="true" aria-labelledby="topic-title"><button id="close-topic" aria-label="Закрыть конспект">×</button><span class="track">${t.track} · ${t.duration} минут</span><h2 id="topic-title">${t.title}</h2><div class="key-callout"><span>!</span><div><b>Формулировка для интервью</b><p>${t.key}</p></div></div><section><h3>Короткий ответ</h3><p>${t.summary}</p></section><section><h3>Разбор</h3><p>${t.theory}</p></section><div class="modal-columns"><section><h3>Вопрос на интервью</h3><p>${t.interview}</p></section><section><h3>Практика</h3><p>${t.exercise}</p></section></div><button class="complete-btn ${complete?'complete':''}" data-complete="${t.id}"><span class="complete-icon" aria-hidden="true">${complete?'✓':''}</span><span>${complete?'Тема пройдена':'Отметить как пройденную'}</span></button></section></div>`;
}

function quizView() {
  if (!state.quiz) startQuiz(false);
  const q=state.quiz.question;
  const accuracy=state.quizStats.answered?Math.round(state.quizStats.correct/state.quizStats.answered*100):0;
  const quizCategories=['Все','QA Core','Web & API','Java AQA','Domain'];
  return `<div class="quiz-head"><div><span class="eyebrow">ИНТЕРВЬЮ-ТРЕНАЖЁР</span><h2>Сессия из 10 вопросов</h2><p>Сначала ответьте вслух. Затем выберите вариант и разберите объяснение.</p></div><button class="new-session-btn" id="new-quiz">Новая сессия ↻</button></div>
    <div class="quiz-workspace">
      <section class="quiz-card quiz-exam">
        <div class="quiz-category"><span>ВОПРОС ${String(state.quiz.index+1).padStart(2,'0')} · ${q.category}</span><b>${state.quiz.index+1} / 10</b></div>
        <div class="quiz-progress"><i style="width:${(state.quiz.index+1)*10}%"></i></div>
        <div class="quiz-prompt"><small>Ваш ответ</small><h3>${q.prompt}</h3><p>Выберите наиболее точную формулировку.</p></div>
        <div class="answers">${q.displayOptions.map((o,i)=>`<button data-answer="${esc(o)}" class="${state.quiz.answered?(o===q.answer?'answer-correct':'answer-muted'):''}" ${state.quiz.answered?'disabled':''}><span>${String.fromCharCode(65+i)}</span><b>${esc(o)}</b></button>`).join('')}</div>
        <div class="quiz-feedback ${state.quiz.correct?'correct':'wrong'} ${state.quiz.answered?'show':''}">${state.quiz.answered?`<span>${state.quiz.correct?'✓':'×'}</span><div><b>${state.quiz.correct?'Верно':'Правильный ответ: '+esc(q.answer)}</b><p>${esc(q.explanation)}</p></div><button id="next-question">${state.quiz.index===9?'Завершить сессию':'Следующий вопрос →'}</button>`:''}</div>
      </section>
      <aside class="quiz-side-panel">
        <span class="kicker">РЕЖИМ СЕССИИ</span><h3>${state.quizCategory==='Все'?'Смешанный раунд':state.quizCategory}</h3>
        <div class="quiz-score"><div><strong>${accuracy}%</strong><span>общая точность</span></div><div><strong>${state.quizStats.answered}</strong><span>ответов дано</span></div></div>
        <div class="quiz-session-dots">${Array.from({length:10},(_,i)=>`<i class="${i<state.quiz.index?'passed':i===state.quiz.index?'current':''}"></i>`).join('')}</div>
        <p class="quiz-side-label">Темы вопросов</p><div class="quiz-topic-picker">${quizCategories.map(c=>`<button data-quiz-category="${c}" class="${state.quizCategory===c?'active':''}">${c}</button>`).join('')}</div>
        <div class="quiz-tip"><span>60 сек</span><p>Сформулируйте короткий ответ и подкрепите его примером из собственного опыта.</p></div>
      </aside>
    </div>`;
}

function startQuiz(renderNow=true) {
  const pool=state.quizCategory==='Все'?questions:questions.filter(q=>q.category===state.quizCategory);
  const set=shuffle(pool).slice(0,10).map(q=>({...q,displayOptions:shuffle(q.options)}));
  state.quiz={set,index:0,question:set[0],answered:false,correct:false}; save(); if(renderNow) renderLearn();
}

function bindLearn() {
  document.querySelectorAll('[data-learn]').forEach(b=>b.addEventListener('click',()=>{state.learnView=b.dataset.learn;state.selectedTopic=null;save();renderLearn();window.scrollTo(0,0);}));
  document.querySelectorAll('[data-track]').forEach(b=>b.addEventListener('click',()=>{state.track=b.dataset.track;state.selectedTopic=null;renderLearn();}));
  document.querySelectorAll('#theory-search,#knowledge-search').forEach(input=>input.addEventListener('input',e=>{state.theorySearchDraft=e.target.value;}));
  document.querySelectorAll('.learn-search-form').forEach(form=>form.addEventListener('submit',e=>{
    e.preventDefault();
    state.theorySearchDraft=form.querySelector('input').value;
    state.theorySearch=state.theorySearchDraft;
    state.selectedTopic=null;
    renderLearn();
  }));
  document.querySelectorAll('[data-knowledge-category]').forEach(b=>b.addEventListener('click',()=>{state.knowledgeCategory=b.dataset.knowledgeCategory;renderLearn();}));
  document.querySelectorAll('[data-topic]').forEach(c=>c.addEventListener('click',()=>{state.selectedTopic=c.dataset.topic;renderLearn();}));
  document.querySelector('#close-topic')?.addEventListener('click',()=>{state.selectedTopic=null;renderLearn();});
  document.querySelector('#topic-overlay')?.addEventListener('click',e=>{if(e.target.id==='topic-overlay'){state.selectedTopic=null;renderLearn();}});
  document.querySelector('[data-complete]')?.addEventListener('click',e=>{e.stopPropagation();const id=e.currentTarget.dataset.complete;state.completed.has(id)?state.completed.delete(id):state.completed.add(id);save();renderLearn();});
  document.querySelector('#new-quiz')?.addEventListener('click',()=>startQuiz());
  document.querySelectorAll('[data-quiz-category]').forEach(b=>b.addEventListener('click',()=>{state.quizCategory=b.dataset.quizCategory;startQuiz();}));
  document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{ if(state.quiz.answered)return; state.quiz.answered=true;state.quiz.correct=b.dataset.answer===state.quiz.question.answer;state.quizStats.answered++;if(state.quiz.correct)state.quizStats.correct++;save();renderLearn(); }));
  document.querySelector('#next-question')?.addEventListener('click',()=>{ if(state.quiz.index===9){toast(`Сессия завершена. Общая точность: ${Math.round(state.quizStats.correct/state.quizStats.answered*100)}%`);startQuiz();}else{state.quiz.index++;state.quiz.question=state.quiz.set[state.quiz.index];state.quiz.answered=false;state.quiz.correct=false;save();renderLearn();} });
}

function toast(message){const t=document.querySelector('#toast');if(!t)return;t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200);}
function render(){ state.mode==='versions'?renderVersions():state.mode==='jobs'?renderJobs():renderLearn(); window.scrollTo(0,0); }
window.addEventListener('hashchange',()=>{state.mode=modeFromHash();render();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.selectedTopic){state.selectedTopic=null;renderLearn();}});
loadVersionHistory();
render();
