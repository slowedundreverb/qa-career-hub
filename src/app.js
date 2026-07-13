import { companies } from './data/companies.js';
import { jobs, linkedinJobs, jobMeta } from './data/jobs.js';
import { curriculum, tracks } from './data/curriculum.js';
import { questions } from './data/questions.js';

const app = document.querySelector('#app');
const saved = JSON.parse(localStorage.getItem('qa-hub-state') || '{}');
const state = {
  mode: location.hash.includes('learn') ? 'learn' : 'jobs',
  learnView: saved.learnView || 'roadmap',
  jobSearch: '', type: 'all', industry: 'all', company: 'all', format: 'all', level: 'all', location: 'all', sort: 'fit',
  favoritesOnly: false,
  track: 'Все', theorySearch: '', knowledgeCategory: 'Все', selectedTopic: null, quizCategory: saved.quizCategory || 'Все',
  completed: new Set(saved.completed || []),
  favorites: new Set(saved.favorites || []),
  quiz: saved.quiz?.set?.length === 10 ? saved.quiz : null,
  quizStats: saved.quizStats || { answered: 0, correct: 0 },
  settingsOpen: false
};

const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const initials = name => name.split(/\s+/).map(x => x[0]).join('').slice(0,2).toUpperCase();
const date = value => value ? new Intl.DateTimeFormat('ru', { day:'2-digit', month:'short' }).format(new Date(value)) : '—';
const save = () => localStorage.setItem('qa-hub-state', JSON.stringify({
  completed:[...state.completed], favorites:[...state.favorites], quizStats: state.quizStats,
  quiz: state.quiz, quizCategory: state.quizCategory, learnView: state.learnView
}));
const shuffle = arr => [...arr].sort(() => Math.random() - .5);

function shell(content) {
  state.settingsOpen=false;
  app.innerHTML = `
    <div class="ambient ambient-a"></div><div class="ambient ambient-b"></div>
    <header class="topbar">
      <a class="brand" href="#jobs" data-mode="jobs" aria-label="QA Career Hub">
        <span class="brand-mark">Q</span><span>QA<span class="brand-accent">/</span>HUB</span>
      </a>
      <nav class="mode-switch" aria-label="Главные разделы">
        <button class="mode-btn ${state.mode === 'jobs' ? 'active' : ''}" data-mode="jobs"><span>01</span> Вакансии</button>
        <button class="mode-btn ${state.mode === 'learn' ? 'active' : ''}" data-mode="learn"><span>02</span> Подготовка</button>
      </nav>
      <div class="settings-wrap">
        <button class="settings-button" id="settings-button" aria-label="Настройки" aria-expanded="false" aria-controls="settings-menu">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/></svg>
        </button>
        <section class="settings-menu" id="settings-menu" aria-label="Меню настроек">
          <span class="kicker">НАСТРОЙКИ</span><h3>Прогресс обучения</h3>
          <p>Автоматически сохраняется в этом браузере.</p>
          <div class="settings-progress"><span>${state.completed.size} / ${curriculum.length} тем</span><span>${state.quizStats.answered} ответов</span></div>
          <button class="settings-reset" id="reset-training-progress">Сбросить прогресс</button>
        </section>
      </div>
    </header>
    ${content}
    <div id="toast" class="toast" role="status"></div>`;
  bindGlobal();
}

function bindGlobal() {
  document.querySelectorAll('[data-mode]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault(); state.mode = el.dataset.mode; state.selectedTopic=null; location.hash = state.mode; render();
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
    return (!state.favoritesOnly || state.favorites.has(j.id)) &&
      (!state.jobSearch || hay.includes(state.jobSearch.toLowerCase())) &&
      (state.type === 'all' || jobType(j) === state.type) &&
      (state.industry === 'all' || (state.industry === 'fintech' ? /fintech|bank|payment|financial|trading|mortgage|insurtech/i.test(j.industry||'') : j.industry === state.industry)) &&
      (state.company === 'all' || j.company === state.company) &&
      (state.format === 'all' || j.format === state.format) &&
      (state.level === 'all' || j.level === state.level) &&
      (state.location === 'all' || j.region?.toLowerCase() === state.location || (state.location === 'remote' && j.format === 'Remote') || (country && j.location.toLowerCase().includes(country))) &&
      j.status !== 'closed';
  }).sort((a,b) => state.sort === 'fit' ? (b.matchScore||0)-(a.matchScore||0) : new Date(b.lastChecked||0)-new Date(a.lastChecked||0));
}

function renderJobs() {
  const list = filteredJobs();
  const active = jobs.filter(j => j.status === 'active').length;
  const cyprus = jobs.filter(j => /cyprus|limassol|nicosia/i.test(j.location)).length;
  const industries=[...new Set(jobs.map(j=>j.industry||'Technology'))].sort((a,b)=>a.localeCompare(b));
  const regions=[...new Set(jobs.map(j=>j.region||'Other'))].sort((a,b)=>a.localeCompare(b));
  const employers=[...new Set(jobs.map(j=>j.company))].sort((a,b)=>a.localeCompare(b));
  const focusCountries=['Germany','Spain','Netherlands','Italy','France','Ireland'];
  shell(`<main class="jobs-layout">
    <aside class="sidebar">
      <div class="eyebrow">CAREER CONTROL</div>
      <h1>Найдите роль,<br><em>которая подходит.</em></h1>
      <p class="lead">Международные QA-вакансии с официальных страниц работодателей.</p>
      <div class="side-nav">
        <button id="show-all-jobs" class="${state.favoritesOnly?'':'active'}"><span>⌁</span> Найденные вакансии <b>${active}</b></button>
        <button id="show-companies"><span>◫</span> Компании <b>${companies.length}</b></button>
        <button id="show-favorites" class="${state.favoritesOnly?'active':''}"><span>♡</span> Сохранённые <b>${state.favorites.size}</b></button>
      </div>
      <div class="update-box" id="update-box"><span class="pulse"></span><div><b>Снимок вакансий</b><small id="update-status">${jobMeta.generatedAt ? `обновлён ${date(jobMeta.generatedAt)}` : 'ещё не создан'}</small></div><button id="refresh-jobs" aria-label="Обновить вакансии" title="Обновить вакансии"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7"/></svg></button></div>
    </aside>
    <section class="jobs-main">
      <div class="jobs-hero">
        <div><div class="eyebrow">${new Date().toLocaleDateString('ru',{weekday:'long',day:'numeric',month:'long'})}</div><h2>Подходящие вакансии</h2><p>${active ? `Есть ${active} активных позиций, ${cyprus} — с фокусом на Кипр.` : 'Запустите обновление, чтобы наполнить агрегатор официальными вакансиями.'}</p></div>
        <div class="hero-stats"><div><strong>${active}</strong><span>активных</span></div><div><strong>${companies.length}</strong><span>компаний</span></div><div><strong>${state.favorites.size}</strong><span>сохранено</span></div></div>
      </div>
      ${linkedinBlock()}
      <div class="filterbar">
        <label class="search"><span>⌕</span><input id="job-search" value="${esc(state.jobSearch)}" placeholder="Должность, компания или технология" /></label>
        ${select('job-industry',[['all','Все отрасли'],['fintech','Fintech / банки'],...industries.map(x=>[x,x])],state.industry)}
        ${select('job-location',[['all','Вся география'],['remote','Только remote'],...focusCountries.map(x=>[`country:${x.toLowerCase()}`,x]),...regions.map(x=>[x.toLowerCase(),x])],state.location)}
        ${select('job-company',[['all','Все компании'],...employers.map(x=>[x,x])],state.company)}
        ${select('job-type',[['all','Все роли'],['manual','Manual QA'],['aqa','Automation'],['java','Java AQA'],['sdet','SDET']],state.type)}
        ${select('job-level',[['all','Любой уровень'],['Junior','Junior'],['Middle','Middle'],['Senior','Senior'],['Lead','Lead']],state.level)}
        ${select('job-format',[['all','Любой формат'],['Remote','Remote'],['Hybrid','Hybrid'],['On-site','Офис']],state.format)}
        ${select('job-sort',[['updated','Сначала свежие'],['fit','По совпадению']],state.sort)}
      </div>
      <div class="results-head"><span><b>${list.length}</b> вакансий после фильтрации</span><small>Только официальные страницы работодателей</small></div>
      <div class="jobs-list">${list.length ? list.map(jobCard).join('') : emptyJobs()}</div>
    </section>
  </main>${companiesDrawer()}`);
  bindJobs();
}

const select = (id, opts, current) => `<label class="select-wrap"><select id="${id}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(l)}</option>`).join('')}</select><span>⌄</span></label>`;

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
      <p>${esc(j.description || 'Описание и требования доступны на официальной странице работодателя.')}</p>
      <div class="tag-cloud job-tags">${(j.technologies||[]).slice(0,6).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
      <div class="job-meta"><span>${esc(j.industry||'Technology')}</span><span>${esc(j.region||'Global')}</span><span>${j.format||'Не указан'}</span><span>${j.level||'Уровень не указан'}</span><span>проверено ${date(j.lastChecked)}</span><span class="status-dot">${j.status==='active'?'активна':'перепроверить'}</span></div>
    </div>
    <a class="apply" href="${esc(j.url)}" target="_blank" rel="noreferrer">Официальная вакансия <span>↗</span></a>
  </article>`;
}

const emptyJobs = () => `<div class="empty-state"><span>⌁</span><h3>${jobs.length ? 'Ничего не найдено' : 'Данные вакансий ещё не обновлены'}</h3><p>${jobs.length ? 'Измените фильтры или поисковый запрос.' : 'В терминале проекта выполните npm run update:jobs. Каждый источник проверяется независимо.'}</p>${jobs.length?'<button id="reset-filters">Сбросить фильтры</button>':''}</div>`;

function companiesDrawer() {
  return `<dialog id="companies-dialog"><div class="dialog-head"><div><span class="eyebrow">WATCHLIST</span><h2>${companies.length} компаний под наблюдением</h2><p>Иностранные работодатели с официальными career-страницами. Компании с явной связью с рынком РФ не включались.</p></div><button id="close-dialog">×</button></div><div class="company-grid">${companies.map(c=>`<a href="${c.careerUrl}" target="_blank" rel="noreferrer"><span class="company-logo small">${initials(c.name)}</span><div><b>${c.name}</b><small>${c.city} · ${c.industry}</small></div><i>${c.priority==='high'?'Кипр':'↗'}</i></a>`).join('')}</div></dialog>`;
}

function bindJobs() {
  const rerenderWith = (key, value) => { state[key] = value; renderJobs(); };
  document.querySelector('#job-search')?.addEventListener('input', e => { state.jobSearch=e.target.value; clearTimeout(window._jobT); window._jobT=setTimeout(renderJobs,220); });
  [['job-type','type'],['job-industry','industry'],['job-company','company'],['job-location','location'],['job-level','level'],['job-format','format'],['job-sort','sort']].forEach(([id,key])=>document.querySelector(`#${id}`)?.addEventListener('change',e=>rerenderWith(key,e.target.value)));
  document.querySelectorAll('[data-favorite]').forEach(b=>b.addEventListener('click',()=>{ state.favorites.has(b.dataset.favorite)?state.favorites.delete(b.dataset.favorite):state.favorites.add(b.dataset.favorite); save(); renderJobs(); }));
  document.querySelector('#reset-filters')?.addEventListener('click',()=>{Object.assign(state,{jobSearch:'',type:'all',industry:'all',company:'all',format:'all',level:'all',location:'all'});renderJobs();});
  const dialog=document.querySelector('#companies-dialog'); document.querySelector('#show-companies')?.addEventListener('click',()=>dialog.showModal()); document.querySelector('#close-dialog')?.addEventListener('click',()=>dialog.close());
  document.querySelector('#show-all-jobs')?.addEventListener('click',()=>{state.favoritesOnly=false;renderJobs();});
  document.querySelector('#show-favorites')?.addEventListener('click',()=>{state.favoritesOnly=true;state.jobSearch='';renderJobs();});
  document.querySelector('#refresh-jobs')?.addEventListener('click',refreshJobs);
}

async function refreshJobs(){
  const box=document.querySelector('#update-box');
  const button=document.querySelector('#refresh-jobs');
  const status=document.querySelector('#update-status');
  if(!box||!button||!status) return;
  box.classList.add('refreshing'); button.disabled=true; status.textContent='проверяем источники…';
  try{
    const response=await fetch('/api/refresh-jobs',{method:'POST'});
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error||'Refresh unavailable');
    status.textContent=`найдено ${result.count} · обновляем страницу`;
    toast(`Готово: ${result.count} активных вакансий`);
    setTimeout(()=>location.reload(),900);
  }catch{
    box.classList.remove('refreshing'); button.disabled=false; status.textContent='не удалось обновить';
    toast('Локальный сервер обновления недоступен. Запустите npm run update:jobs');
  }
}

function renderLearn() {
  const done = state.completed.size;
  const pct = Math.round(done / curriculum.length * 100);
  shell(`<main class="learn-shell">
    <aside class="learn-sidebar">
      <div class="eyebrow">INTERVIEW LAB</div><h1>Тренируйся.<br><em>Отвечай уверенно.</em></h1>
      <div class="progress-ring" style="--p:${pct}"><div><strong>${pct}%</strong><span>курса</span></div></div>
      <nav class="learn-nav">
        <button data-learn="roadmap" class="${state.learnView==='roadmap'?'active':''}"><span>⌘</span><div><b>Мой маршрут</b><small>${curriculum.length} тем</small></div></button>
        <button data-learn="theory" class="${state.learnView==='theory'?'active':''}"><span>≡</span><div><b>База знаний</b><small>теория и практика</small></div></button>
        <button data-learn="quiz" class="${state.learnView==='quiz'?'active':''}"><span>⚡</span><div><b>Тренажёр</b><small>${questions.length} вопросов</small></div></button>
      </nav>
    </aside>
    <section class="learn-main">${state.learnView==='quiz'?quizView():state.learnView==='theory'?knowledgeView():theoryView(true)}</section>
  </main>`);
  bindLearn();
}

function theoryView(roadmap=false) {
  const filtered = curriculum.filter(t => (state.track==='Все'||t.track===state.track) && `${t.title} ${t.summary} ${t.theory}`.toLowerCase().includes(state.theorySearch.toLowerCase()));
  return `<div class="learn-head"><div><span class="eyebrow">${roadmap?'ПЛАН ПОДГОТОВКИ':'БАЗА ЗНАНИЙ'}</span><h2>${roadmap?'От уверенного Manual к Java AQA':'Коротко. По делу. Для интервью.'}</h2><p>${roadmap?'Закрепите QA core и двигайтесь к устойчивой автоматизации в удобном порядке.':'Ищите по теме, фильтруйте трек и отмечайте пройденное.'}</p></div><div class="streak"><span>◆</span><div><b>${state.completed.size} / ${curriculum.length}</b><small>тем завершено</small></div></div></div>
  <div class="theory-tools"><label class="search"><span>⌕</span><input id="theory-search" value="${esc(state.theorySearch)}" placeholder="Найти определение или тему" /></label><div class="track-tabs">${tracks.map(t=>`<button data-track="${t}" class="${state.track===t?'active':''}">${t}</button>`).join('')}</div></div>
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
    <div class="knowledge-tools"><label class="search"><span>⌕</span><input id="knowledge-search" value="${esc(state.theorySearch)}" placeholder="Найти вопрос, термин или ответ" /></label><div class="knowledge-tabs">${categories.map(c=>`<button data-knowledge-category="${c}" class="${state.knowledgeCategory===c?'active':''}">${c}</button>`).join('')}</div></div>
    <div class="knowledge-layout"><section class="knowledge-list">${filtered.map((q,i)=>`<details class="knowledge-card" ${i===0?'open':''}><summary><span>${String(i+1).padStart(2,'0')}</span><div><small>${q.category}</small><h3>${q.prompt}</h3></div><b>+</b></summary><div class="knowledge-answer"><section><span>Короткий ответ</span><p>${q.answer}</p></section><section><span>Почему так</span><p>${q.explanation}</p></section></div></details>`).join('')||'<div class="empty-state"><h3>Ничего не найдено</h3><p>Измените запрос или категорию.</p></div>'}</section>
    <aside class="resource-panel"><span class="kicker">ПОЛЕЗНО ПОЧИТАТЬ</span><h3>Официальные источники</h3><div class="resource-list">${resources.map(([tag,title,description,url])=>`<a href="${url}" target="_blank" rel="noreferrer"><small>${tag}</small><b>${title}</b><span>${description}</span><i>↗</i></a>`).join('')}</div></aside></div>`;
}

function topicCard(t,i,roadmap) {
  const done=state.completed.has(t.id);
  return `<article class="topic-card ${done?'done':''}" data-topic="${t.id}"><div class="topic-num">${String(i+1).padStart(2,'0')}</div><div class="topic-body"><div class="topic-top"><span class="track">${t.track}</span><span>${t.duration} мин</span></div><h3>${t.title}</h3><p>${t.summary}</p><div class="topic-footer"><span>${done?'✓ Пройдено':'Открыть конспект'}</span><b>→</b></div></div></article>`;
}

function topicModal(t) {
  if(!t) return '';
  return `<div class="topic-overlay" id="topic-overlay"><section class="topic-modal" role="dialog" aria-modal="true" aria-labelledby="topic-title"><button id="close-topic" aria-label="Закрыть конспект">×</button><span class="track">${t.track} · ${t.duration} минут</span><h2 id="topic-title">${t.title}</h2><div class="key-callout"><span>!</span><div><b>Формулировка для интервью</b><p>${t.key}</p></div></div><section><h3>Короткий ответ</h3><p>${t.summary}</p></section><section><h3>Разбор</h3><p>${t.theory}</p></section><div class="modal-columns"><section><h3>Вопрос на интервью</h3><p>${t.interview}</p></section><section><h3>Практика</h3><p>${t.exercise}</p></section></div><button class="complete-btn ${state.completed.has(t.id)?'complete':''}" data-complete="${t.id}">${state.completed.has(t.id)?'✓ Тема пройдена':'Отметить как пройденную'}</button></section></div>`;
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
        <div class="quiz-tip"><span>60 сек</span><p>Дайте короткий ответ, затем добавьте пример из банковского или mobile-проекта.</p></div>
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
  document.querySelector('#theory-search')?.addEventListener('input',e=>{state.theorySearch=e.target.value;state.selectedTopic=null;clearTimeout(window._theoryT);window._theoryT=setTimeout(renderLearn,180);});
  document.querySelector('#knowledge-search')?.addEventListener('input',e=>{state.theorySearch=e.target.value;clearTimeout(window._knowledgeT);window._knowledgeT=setTimeout(renderLearn,180);});
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
function render(){ state.mode==='jobs'?renderJobs():renderLearn(); window.scrollTo(0,0); }
window.addEventListener('hashchange',()=>{state.mode=location.hash.includes('learn')?'learn':'jobs';render();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.selectedTopic){state.selectedTopic=null;renderLearn();}});
render();
