import { companies } from './data/companies.js';
import { companyLogos } from './data/company-logos.js';
import { jobs, linkedinJobs, jobMeta } from './data/jobs.js';
import { curriculum, tracks } from './data/curriculum.js';
import { interviewQuestions, interviewCategories } from './data/interview-questions.js';

const app = document.querySelector('#app');
const saved = JSON.parse(localStorage.getItem('qa-hub-state') || '{}');
const learningContentVersion = 'interview-quiz-2026-08-09';
const savedLearningIsCurrent = saved.learningContentVersion === learningContentVersion;
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
  learnView: saved.learnView === 'quiz' ? 'quiz' : 'roadmap',
  jobSearch: '', jobSearchDraft: '', type: 'all', industry: 'all', company: 'all', format: 'all', level: 'all', location: 'all', sort: 'fit', jobFiltersOpen: false,
  companySearch: '', companySearchDraft: '', companyOpenFirst: true,
  favoritesOnly: false,
  track: 'Все', theorySearch: '', theorySearchDraft: '', selectedTopic: null, selectedPlanQuestion: null,
  completed: new Set(savedLearningIsCurrent ? saved.completed || [] : []),
  favorites: new Set(saved.favorites || []),
  quizCategory: savedLearningIsCurrent && interviewCategories.includes(saved.quizCategory) ? saved.quizCategory : 'Все',
  quiz: savedLearningIsCurrent && saved.quiz?.set?.length ? saved.quiz : null,
  quizStats: savedLearningIsCurrent ? saved.quizStats || { answered: 0, correct: 0 } : { answered: 0, correct: 0 },
  settingsOpen: false
};

const planTheoryCoveredQuestions=new Set([26,28,30,31,37,47]);

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
const jobCountry = job => job.country || (/cyprus|limassol|nicosia|paphos/i.test(job.location||'') ? 'Cyprus' : /remote|global|worldwide|anywhere/i.test(job.location||'') ? 'Worldwide' : 'Country not specified');
const watchedCompanies = () => companies;
const companyKey = name => String(name).replace(/\.US$/,'').replace(/\s*\/\s*Gen Digital$/,'').trim().toLowerCase();
const companyLogo = (name, small=false) => {
  const logo=companyLogos[companyKey(name)];
  return `<span class="company-logo${small?' small':''}" style="--h:${(name.length*31)%360}"><span>${esc(initials(name))}</span>${logo?`<img src="${esc(logo)}" alt="" loading="lazy" onerror="this.remove()">`:''}</span>`;
};
const date = value => value ? new Intl.DateTimeFormat('ru', { day:'2-digit', month:'short' }).format(new Date(value)) : '—';
const save = () => localStorage.setItem('qa-hub-state', JSON.stringify({
  completed:[...state.completed], favorites:[...state.favorites], learnView: state.learnView,
  quizCategory: state.quizCategory, quiz: state.quiz, quizStats: state.quizStats,
  learningContentVersion
}));
const shuffle = array => [...array].sort(() => Math.random() - .5);
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
  document.querySelectorAll('.mobile-navigation-spacer').forEach(spacer=>spacer.remove());
  document.querySelectorAll('.sidebar, .learn-sidebar').forEach(banner=>banner.classList.remove('is-collapsing','is-condensed','is-fixed'));
  mobileNavigationCleanup=undefined;
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
      state.selectedPlanQuestion=null;
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
  if(!confirm('Сбросить пройденные темы и прогресс интервью-тренажёра?')) return;
  state.completed.clear();
  state.quiz=null;
  state.quizCategory='Все';
  state.quizStats={answered:0,correct:0};
  state.learnView='roadmap';
  state.selectedTopic=null;
  state.selectedPlanQuestion=null;
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
    <header class="job-card-header">${companyLogo(j.company)}<div class="job-card-employer"><b>${esc(j.company)}</b><span>${esc(jobCountry(j))}</span></div><button class="save ${fav?'saved':''}" data-favorite="${esc(j.id)}" aria-label="${fav?'Убрать из сохранённых':'Сохранить вакансию'}">${fav?'♥':'♡'}</button></header>
    <div class="job-content"><div class="job-title-row"><div><span class="fit ${j.matchScore>=85?'great':''}">${j.matchScore||70}% совпадение</span><h3>${esc(j.title)}</h3></div></div>
      <div class="job-company"><span>${esc(j.location)}</span></div>
      <div class="tag-cloud job-tags">${(j.technologies||[]).slice(0,4).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
      <div class="job-meta"><span>${esc(j.industry||'Technology')}</span><span>${esc(jobCountry(j))}</span><span>${j.format||'Не указан'}</span><span>${j.level||'Уровень не указан'}</span><span>проверено ${date(j.lastChecked)}</span><span class="status-dot">${j.status==='active'?'активна':'перепроверить'}</span></div>
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
      <article><span>02</span><h3>Изучать компании</h3><p>Открывать проверенные официальные карьерные страницы работодателей из единого каталога.</p></article>
      <article><span>03</span><h3>Готовиться к интервью</h3><p>Проходить маршрут тем, повторять базу знаний и тренироваться на вопросах с объяснениями.</p></article>
    </div>
    <footer class="about-author"><span class="about-avatar">ГП</span><div><small>СОЗДАТЕЛЬ ПРОЕКТА</small><strong>Глеб Провоторов</strong><p>QA Engineer · идея, продукт и развитие QA Career Hub</p><a class="about-telegram" href="https://t.me/slowedundreverb" target="_blank" rel="noopener noreferrer" aria-label="Telegram Глеба Провоторова">Telegram · @slowedundreverb <span aria-hidden="true">↗</span></a></div></footer>
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
  const query=state.companySearch.toLowerCase();
  const directory=watchlist
    .map((company,index)=>({company,index,count:companyCounts.get(companyKey(company.name))||0}))
    .filter(({company})=>!query||[company.name,company.country,company.city,company.industry].some(value=>String(value||'').toLowerCase().includes(query)))
    .sort((a,b)=>state.companyOpenFirst?((b.count>0)-(a.count>0)||a.index-b.index):a.index-b.index);
  const card=({company:c,count})=>`<article class="company-entry">
    <a href="${esc(c.careerUrl)}" target="_blank" rel="noreferrer">
      ${companyLogo(c.name,true)}
      <div><b>${esc(c.name)}</b><small>${esc(c.city)} · ${esc(c.industry)}</small></div><i>${c.priority==='high'?'Кипр':'↗'}</i>
      <em>${count}${coveredEmployers.has(companyKey(c.name))?' QA':' · ссылка'}</em>
    </a>
  </article>`;
  return `<dialog id="companies-dialog">
    <div class="dialog-head"><div><span class="eyebrow">COMPANY RADAR</span><h2>${watchlist.length} компаний под наблюдением</h2><p>Проверенные официальные career-страницы работодателей из ежедневного автоматического мониторинга.</p></div><button id="close-dialog" aria-label="Закрыть список компаний">×</button></div>
    <form class="company-directory-tools" id="company-search-form">
      <label class="company-directory-search"><span aria-hidden="true">⌕</span><input id="company-search" value="${esc(state.companySearchDraft)}" placeholder="Найти компанию, страну или отрасль" aria-label="Поиск компаний" /><button type="submit" aria-label="Выполнить поиск компаний">Найти</button></label>
      <button class="company-open-first ${state.companyOpenFirst?'active':''}" id="company-open-first" type="button" aria-pressed="${state.companyOpenFirst}"><span aria-hidden="true">${state.companyOpenFirst?'✓':'↕'}</span> С вакансиями сначала</button>
    </form>
    <div class="company-directory-summary"><span><b>${directory.length}</b> из ${watchlist.length} компаний</span>${state.companySearch?`<button id="company-search-reset" type="button">Сбросить поиск</button>`:''}</div>
    <div class="companies-dialog-body" role="region" aria-label="Список компаний" tabindex="0">
      <div class="company-grid">${directory.length?directory.map(card).join(''):`<div class="company-directory-empty"><b>Компании не найдены</b><span>Измените запрос или сбросьте поиск.</span></div>`}</div>
    </div>
  </dialog>`;
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
  const reopenCompanies=()=>{renderJobs();document.querySelector('#companies-dialog')?.showModal();};
  document.querySelector('#company-search')?.addEventListener('input',e=>{state.companySearchDraft=e.target.value;});
  document.querySelector('#company-search-form')?.addEventListener('submit',e=>{e.preventDefault();state.companySearch=state.companySearchDraft.trim();reopenCompanies();});
  document.querySelector('#company-open-first')?.addEventListener('click',()=>{state.companyOpenFirst=!state.companyOpenFirst;reopenCompanies();});
  document.querySelector('#company-search-reset')?.addEventListener('click',()=>{state.companySearch='';state.companySearchDraft='';reopenCompanies();});
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
    const previousCount=jobs.length;
    const response=await fetch(`/api/refresh-jobs?refresh=${Date.now()}`,{method:'POST',cache:'no-store',headers:{'cache-control':'no-cache'}});
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error||'Refresh unavailable');
    if(!Array.isArray(result.jobs)) throw new Error('Invalid refresh response');
    jobs.splice(0,jobs.length,...result.jobs);
    linkedinJobs.splice(0,linkedinJobs.length,...(result.linkedinJobs||[]));
    Object.assign(jobMeta,result.meta||{generatedAt:new Date().toISOString()});
    sessionStorage.setItem('qa-hub-jobs',JSON.stringify({jobs:result.jobs,linkedinJobs:result.linkedinJobs||[],meta:jobMeta}));
    state.settingsOpen=false;
    render();
    const fxProCount=result.jobs.filter(job=>companyKey(job.company)==='fxpro').length;
    const delta=result.count-previousCount;
    toast(`Обновлено: ${result.count} вакансий${delta?` (${delta>0?'+':''}${delta})`:''} · FxPro: ${fxProCount}${result.warnings?` · ${sourceWarning(result.warnings)}`:''}`);
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
        <button data-learn="roadmap" class="${state.learnView==='roadmap'?'active':''}"><span>${navIcon('roadmap')}</span><div><b>План подготовки</b><small>${curriculum.length} тем + ${interviewQuestions.length} вопросов</small></div></button>
        <button data-learn="quiz" class="${state.learnView==='quiz'?'active':''}"><span>${navIcon('quiz')}</span><div><b>Интервью-тренажёр</b><small>${interviewQuestions.length} реальных вопросов</small></div></button>
      </nav>
    </aside>
    <section class="learn-main">${state.learnView==='quiz'?interviewTrainerView():theoryView()}</section>
  </main>`);
  bindLearn();
}

function theoryView() {
  const query=state.theorySearch.toLowerCase();
  const filtered = curriculum.filter(t => {
    const related=interviewQuestions.filter(question=>question.planTopicId===t.id);
    return (state.track==='Все'||t.track===state.track) && `${t.title} ${t.summary} ${t.theory} ${related.map(question=>question.prompt).join(' ')}`.toLowerCase().includes(query);
  });
  return `<div class="learn-head"><div><span class="eyebrow">ПЛАН ПОДГОТОВКИ</span><h2>Теория и готовые ответы</h2><p>Читайте конспекты, раскрывайте вопросы и сверяйтесь с короткими ответами и объяснениями — без перехода в тренажёр.</p></div><div class="streak"><span>◆</span><div><b>${state.completed.size} / ${curriculum.length}</b><small>тем завершено</small></div></div></div>
  <div class="theory-tools"><form class="search learn-search-form"><input id="theory-search" value="${esc(state.theorySearchDraft)}" placeholder="Найти определение или тему" aria-label="Поиск по плану подготовки" /><button class="learn-search-button" type="submit" aria-label="Выполнить поиск" title="Выполнить поиск">⌕</button></form><div class="track-tabs">${tracks.map(t=>`<button data-track="${t}" class="${state.track===t?'active':''}">${t}</button>`).join('')}</div></div>
  <div class="plan-topic-list">${filtered.map((t,i)=>planTopicSection(t,curriculum.indexOf(t))).join('')}</div>${!filtered.length?'<div class="empty-state"><h3>Темы не найдены</h3><p>Измените запрос или выберите другой трек.</p></div>':''}
  ${state.selectedTopic?topicModal(curriculum.find(t=>t.id===state.selectedTopic)):''}
  ${state.selectedPlanQuestion?planQuestionModal(interviewQuestions.find(question=>question.id===state.selectedPlanQuestion)):''}`;
}

function planTopicSection(topic,index) {
  const questions=interviewQuestions.filter(question=>question.planTopicId===topic.id&&!planTheoryCoveredQuestions.has(question.number));
  return `<section class="plan-topic-section" aria-labelledby="plan-topic-${topic.id}">
    <div class="plan-topic-heading"><div><small>${esc(topic.track)}</small><h3 id="plan-topic-${topic.id}">${esc(topic.title)}</h3></div><b>${questions.length ? `${questions.length} ${questions.length===1?'вопрос':'вопросов'}` : 'только теория'}</b></div>
    <div class="plan-topic-grid">${topicCard(topic,index)}${questions.map(question=>questionPickCard(question,'plan')).join('')}</div>
  </section>`;
}

function topicCard(t,i) {
  const done=state.completed.has(t.id);
  return `<article class="topic-card ${done?'done':''}" data-topic="${t.id}"><div class="topic-num">${String(i+1).padStart(2,'0')}</div><div class="topic-body"><div class="topic-top"><span class="track">${t.track}</span><span>${t.duration} мин</span></div><h3>${t.title}</h3><p>${t.summary}</p><div class="topic-footer"><span>${done?'✓ Пройдено':'Открыть конспект'}</span><b>→</b></div></div></article>`;
}

function topicModal(t) {
  if(!t) return '';
  const complete=state.completed.has(t.id);
  const sections=(t.sections||[]).map(section=>`<section class="topic-section"><h3>${esc(section.title)}</h3>${section.flow?`<div class="topic-flow">${section.flow.map((step,index)=>`<span>${esc(step)}${index<section.flow.length-1?'<i>→</i>':''}</span>`).join('')}</div>`:''}${section.points?`<div class="topic-points">${section.points.map(([term,description])=>`<div><b>${esc(term)}</b><p>${esc(description)}</p></div>`).join('')}</div>`:''}${section.note?`<p class="topic-note">${esc(section.note)}</p>`:''}</section>`).join('');
  return `<div class="topic-overlay" id="topic-overlay"><section class="topic-modal" role="dialog" aria-modal="true" aria-labelledby="topic-title"><button id="close-topic" aria-label="Закрыть конспект">×</button><span class="track">${t.track} · ${t.duration} минут</span><h2 id="topic-title">${t.title}</h2><div class="key-callout"><span>!</span><div><b>Формулировка для интервью</b><p>${t.key}</p></div></div><section><h3>Короткий ответ</h3><p>${t.summary}</p></section><div class="topic-sections">${sections}</div><div class="modal-columns"><section><h3>Вопрос на интервью</h3><p>${t.interview}</p></section><section><h3>Практика</h3><p>${t.exercise}</p></section></div><button class="complete-btn ${complete?'complete':''}" data-complete="${t.id}"><span class="complete-icon" aria-hidden="true">${complete?'✓':''}</span><span>${complete?'Тема пройдена':'Отметить как пройденную'}</span></button></section></div>`;
}

function planQuestionModal(question) {
  if(!question) return '';
  const topic=curriculum.find(entry=>entry.id===question.planTopicId);
  const sections=(topic?.sections||[]).map(section=>`<section class="topic-section"><h3>${esc(section.title)}</h3>${section.flow?`<div class="topic-flow">${section.flow.map((step,index)=>`<span>${esc(step)}${index<section.flow.length-1?'<i>→</i>':''}</span>`).join('')}</div>`:''}${section.points?`<div class="topic-points">${section.points.map(([term,description])=>`<div><b>${esc(term)}</b><p>${esc(description)}</p></div>`).join('')}</div>`:''}${section.note?`<p class="topic-note">${esc(section.note)}</p>`:''}</section>`).join('');
  return `<div class="topic-overlay" id="question-overlay"><section class="topic-modal question-modal" role="dialog" aria-modal="true" aria-labelledby="question-title"><button id="close-plan-question" aria-label="Закрыть вопрос">×</button><span class="track">ВОПРОС ${String(question.number).padStart(2,'0')} · ${esc(question.category)}</span><h2 id="question-title">${esc(question.prompt)}</h2><div class="key-callout"><span>!</span><div><b>Короткий ответ</b><p>${esc(question.answer)}</p></div></div><section class="question-explanation"><h3>Почему так</h3><p>${esc(question.explanation)}</p></section>${topic?`<section class="question-topic-context"><span class="kicker">КОНТЕКСТ ТЕМЫ</span><h3>${esc(topic.title)}</h3><p>${esc(topic.theory)}</p></section><div class="topic-sections">${sections}</div>`:''}</section></div>`;
}

function interviewTrainerView() {
  if(state.quiz?.finished) return quizCompleteView();
  if(state.quiz?.set?.length) return quizQuestionView();
  return quizOverviewView();
}

function questionPickCard(question,context='trainer') {
  if(context==='plan'){
    return `<button class="question-pick-card in-plan" data-plan-question-id="${question.id}"><span>${String(question.number).padStart(2,'0')}</span><div><small>${esc(question.category)}</small><b>${esc(question.prompt)}</b></div><i>→</i></button>`;
  }
  return `<button class="question-pick-card" data-question-id="${question.id}"><span>${String(question.number).padStart(2,'0')}</span><div><small>${esc(question.category)}</small><b>${esc(question.prompt)}</b></div><i>→</i></button>`;
}

function quizOverviewView() {
  const groups=interviewCategories.filter(category=>category!=='Все');
  return `<div class="quiz-overview-head"><span class="eyebrow">ИНТЕРВЬЮ-ТРЕНАЖЁР</span><h2>Выберите тему или начните сессию</h2><p>${interviewQuestions.length} вопросов с вариантами ответов и объяснениями. Можно открыть любой вопрос или пройти случайный раунд.</p></div>
    <section class="quiz-session-launch">
      <div><span class="kicker">РЕЖИМ СЕССИИ</span><h3>10 случайных вопросов</h3><p>Выберите фокус. Если в теме меньше десяти вопросов, раунд дополнится вопросами из других тем.</p></div>
      <div class="quiz-session-actions"><div class="quiz-focus-picker">${interviewCategories.map(category=>`<button data-quiz-category="${esc(category)}" class="${state.quizCategory===category?'active':''}">${esc(category)}</button>`).join('')}</div><button id="start-random-session">Начать сессию →</button></div>
    </section>
    <div class="quiz-groups">${groups.map(category=>{
      const questions=interviewQuestions.filter(question=>question.category===category);
      return `<section class="quiz-group"><div class="quiz-group-head"><div><span>${String(questions.length).padStart(2,'0')}</span><h3>${esc(category)}</h3></div><p>${questions.length} вопросов</p></div><div class="quiz-question-grid">${questions.map(question=>questionPickCard(question)).join('')}</div></section>`;
    }).join('')}</div>`;
}

function activeQuizQuestion() {
  const item=state.quiz?.set?.[state.quiz.index];
  const question=interviewQuestions.find(entry=>entry.id===item?.id);
  return question ? {...question,displayOptions:item.displayOptions} : null;
}

function quizQuestionView() {
  const question=activeQuizQuestion();
  if(!question){ state.quiz=null; return quizOverviewView(); }
  const total=state.quiz.set.length;
  const accuracy=state.quiz.index ? Math.round(state.quiz.score/state.quiz.index*100) : 0;
  return `<div class="quiz-head"><div><span class="eyebrow">ИНТЕРВЬЮ-ТРЕНАЖЁР</span><h2>${state.quiz.mode==='session'?'Сессия из 10 вопросов':question.category}</h2><p>Выберите наиболее точный ответ, затем разберите объяснение.</p></div><button class="new-session-btn" id="back-to-quiz-list">Все вопросы</button></div>
    <div class="quiz-workspace ${state.quiz.mode==='session'?'session':'single'}">
      <section class="quiz-card quiz-exam">
        <div class="quiz-category"><span>ВОПРОС ${String(question.number).padStart(2,'0')} · ${esc(question.category)}</span><b>${state.quiz.index+1} / ${total}</b></div>
        <div class="quiz-progress"><i style="width:${((state.quiz.index+1)/total)*100}%"></i></div>
        <div class="quiz-prompt"><small>Выберите ответ</small><h3>${esc(question.prompt)}</h3><p>Один вариант точнее остальных.</p></div>
        <div class="answers">${question.displayOptions.map((option,index)=>`<button data-answer="${esc(option)}" class="${state.quiz.answered?(option===question.answer?'answer-correct':option===state.quiz.selected?'answer-wrong':'answer-muted'):''}" ${state.quiz.answered?'disabled':''}><span>${String.fromCharCode(65+index)}</span><b>${esc(option)}</b></button>`).join('')}</div>
        <div class="quiz-feedback ${state.quiz.correct?'correct':'wrong'} ${state.quiz.answered?'show':''}">${state.quiz.answered?`<span>${state.quiz.correct?'✓':'×'}</span><div><b>${state.quiz.correct?'Верно':'Правильный ответ: '+esc(question.answer)}</b><p>${esc(question.explanation)}</p></div><button id="next-quiz-question">${state.quiz.mode==='session'?(state.quiz.index===total-1?'Завершить сессию':'Следующий вопрос →'):'Следующий в теме →'}</button>`:''}</div>
      </section>
      ${state.quiz.mode==='session'?`<aside class="quiz-side-panel">
        <span class="kicker">РЕЖИМ СЕССИИ</span><h3>${state.quizCategory==='Все'?'Смешанный раунд':state.quizCategory}</h3>
        <div class="quiz-score"><div><strong>${state.quiz.score}</strong><span>верных ответов</span></div><div><strong>${state.quiz.index+(state.quiz.answered?1:0)}</strong><span>ответов дано</span></div></div>
        <div class="quiz-session-dots">${Array.from({length:total},(_,index)=>`<i class="${index<state.quiz.index?'passed':index===state.quiz.index?'current':''}"></i>`).join('')}</div>
        <div class="quiz-tip"><span>${accuracy}%</span><p>точность до текущего вопроса</p></div>
      </aside>`:''}
    </div>`;
}

function quizCompleteView() {
  const total=state.quiz.set.length;
  return `<section class="quiz-complete" aria-labelledby="quiz-complete-title"><div class="fireworks" aria-hidden="true">${Array.from({length:28},(_,index)=>`<i style="--i:${index}"></i>`).join('')}</div><div class="quiz-complete-mark">✓</div><span class="eyebrow">СЕССИЯ ЗАВЕРШЕНА</span><h2 id="quiz-complete-title">Отличная работа!</h2><p>Верных ответов: <strong>${state.quiz.score} из ${total}</strong>. Через несколько секунд вопросы сбросятся, и можно будет начать новый раунд.</p><button id="finish-celebration">К списку вопросов</button></section>`;
}

function quizSetItem(question) {
  return {id:question.id,displayOptions:shuffle(question.options)};
}

function startSingleQuestion(id) {
  const question=interviewQuestions.find(entry=>entry.id===id);
  if(!question) return;
  enterQuizHistory();
  state.quiz={mode:'single',set:[quizSetItem(question)],index:0,score:0,answered:false,correct:false,selected:'',finished:false};
  state.learnView='quiz';
  save(); renderLearn(); window.scrollTo(0,0);
}

function startRandomSession() {
  const primary=state.quizCategory==='Все'?interviewQuestions:interviewQuestions.filter(question=>question.category===state.quizCategory);
  const rest=state.quizCategory==='Все'?[]:interviewQuestions.filter(question=>question.category!==state.quizCategory);
  const set=shuffle(primary).concat(shuffle(rest)).slice(0,10).map(quizSetItem);
  enterQuizHistory();
  state.quiz={mode:'session',set,index:0,score:0,answered:false,correct:false,selected:'',finished:false};
  save(); renderLearn(); window.scrollTo(0,0);
}

function enterQuizHistory() {
  if(history.state?.qaHubQuiz) return;
  history.pushState({...history.state,qaHubQuiz:true},'',location.href);
}

function resetQuizToOverview(fromHistory=false) {
  if(!fromHistory&&history.state?.qaHubQuiz){
    history.back();
    return;
  }
  state.quiz=null;
  save(); renderLearn(); window.scrollTo(0,0);
}

function bindLearn() {
  document.querySelectorAll('[data-learn]').forEach(b=>b.addEventListener('click',()=>{state.learnView=b.dataset.learn;state.selectedTopic=null;state.selectedPlanQuestion=null;if(state.learnView!=='quiz')state.quiz=null;save();renderLearn();window.scrollTo(0,0);}));
  document.querySelectorAll('[data-track]').forEach(b=>b.addEventListener('click',()=>{state.track=b.dataset.track;state.selectedTopic=null;state.selectedPlanQuestion=null;renderLearn();}));
  document.querySelectorAll('#theory-search').forEach(input=>input.addEventListener('input',e=>{state.theorySearchDraft=e.target.value;}));
  document.querySelectorAll('.learn-search-form').forEach(form=>form.addEventListener('submit',e=>{
    e.preventDefault();
    state.theorySearchDraft=form.querySelector('input').value;
    state.theorySearch=state.theorySearchDraft;
    state.selectedTopic=null;
    state.selectedPlanQuestion=null;
    renderLearn();
  }));
  document.querySelectorAll('[data-topic]').forEach(c=>c.addEventListener('click',()=>{state.selectedPlanQuestion=null;state.selectedTopic=c.dataset.topic;renderLearn();}));
  document.querySelectorAll('[data-plan-question-id]').forEach(card=>card.addEventListener('click',()=>{state.selectedTopic=null;state.selectedPlanQuestion=card.dataset.planQuestionId;renderLearn();}));
  document.querySelector('#close-topic')?.addEventListener('click',()=>{state.selectedTopic=null;renderLearn();});
  document.querySelector('#topic-overlay')?.addEventListener('click',e=>{if(e.target.id==='topic-overlay'){state.selectedTopic=null;renderLearn();}});
  document.querySelector('#close-plan-question')?.addEventListener('click',()=>{state.selectedPlanQuestion=null;renderLearn();});
  document.querySelector('#question-overlay')?.addEventListener('click',e=>{if(e.target.id==='question-overlay'){state.selectedPlanQuestion=null;renderLearn();}});
  document.querySelector('[data-complete]')?.addEventListener('click',e=>{e.stopPropagation();const id=e.currentTarget.dataset.complete;state.completed.has(id)?state.completed.delete(id):state.completed.add(id);save();renderLearn();});
  document.querySelectorAll('[data-question-id]').forEach(button=>button.addEventListener('click',()=>startSingleQuestion(button.dataset.questionId)));
  document.querySelectorAll('[data-quiz-category]').forEach(button=>button.addEventListener('click',()=>{state.quizCategory=button.dataset.quizCategory;save();renderLearn();}));
  document.querySelector('#start-random-session')?.addEventListener('click',startRandomSession);
  document.querySelector('#back-to-quiz-list')?.addEventListener('click',resetQuizToOverview);
  document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
    if(state.quiz?.answered) return;
    const question=activeQuizQuestion();
    state.quiz.answered=true;
    state.quiz.selected=button.dataset.answer;
    state.quiz.correct=button.dataset.answer===question.answer;
    if(state.quiz.correct) state.quiz.score++;
    state.quizStats.answered++;
    if(state.quiz.correct) state.quizStats.correct++;
    save(); renderLearn();
  }));
  document.querySelector('#next-quiz-question')?.addEventListener('click',()=>{
    if(state.quiz.mode==='single'){
      const current=activeQuizQuestion();
      const inCategory=interviewQuestions.filter(question=>question.category===current.category);
      const next=inCategory[(inCategory.findIndex(question=>question.id===current.id)+1)%inCategory.length];
      startSingleQuestion(next.id);
      return;
    }
    if(state.quiz.index===state.quiz.set.length-1){
      state.quiz.finished=true;
      save(); renderLearn();
      window.setTimeout(()=>{if(state.quiz?.finished) resetQuizToOverview();},5200);
      return;
    }
    state.quiz.index++;
    state.quiz.answered=false;
    state.quiz.correct=false;
    state.quiz.selected='';
    save(); renderLearn(); window.scrollTo(0,0);
  });
  document.querySelector('#finish-celebration')?.addEventListener('click',resetQuizToOverview);
}

function toast(message){const t=document.querySelector('#toast');if(!t)return;t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200);}
function render(){ state.mode==='versions'?renderVersions():state.mode==='jobs'?renderJobs():renderLearn(); window.scrollTo(0,0); }
window.addEventListener('hashchange',()=>{state.mode=modeFromHash();render();});
window.addEventListener('popstate',event=>{
  if(state.mode==='learn'&&state.learnView==='quiz'&&state.quiz&&!event.state?.qaHubQuiz){
    resetQuizToOverview(true);
    return;
  }
  state.mode=modeFromHash();
  render();
});
window.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  if(state.selectedPlanQuestion){state.selectedPlanQuestion=null;renderLearn();return;}
  if(state.selectedTopic){state.selectedTopic=null;renderLearn();}
});
loadVersionHistory();
render();
