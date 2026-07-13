# QA Career Hub

Универсальный desktop-first сайт для поиска QA/AQA-вакансий и подготовки к собеседованиям. Проект не требует фреймворка или базы данных: интерфейс разворачивается как обычная статика, а Node.js обновляет snapshot официальных вакансий.

## Что внутри

- два самостоятельных режима: «Вакансии» и «Подготовка»;
- реестр 100+ международных компаний с официальными career-страницами и приоритетом fintech, банков и payments;
- сборщик публичных Lever, Greenhouse и Ashby API с изоляцией ошибок источников;
- динамические фильтры по отрасли, компании, роли, seniority, региону по всему миру, формату и совпадению;
- честное состояние LinkedIn: данные появляются только при подключённом легальном API;
- 34 учебные темы: QA, web/API, SQL, mobile, payments, Thredd/i2c, Sumsub, Java AQA;
- отдельная база знаний в формате «вопрос → ответ → почему» с официальными материалами ISTQB, MDN, OWASP, Postman, Oracle, Selenium и Testcontainers;
- 130 вопросов в тренажёре, сессии по 10 вопросов, прогресс и сохранённые вакансии в LocalStorage;
- шестерёнка настроек со сбросом учебного прогресса; текущая сессия восстанавливается после перезагрузки;
- кнопка обновления снимка вакансий при запуске через локальный Node-сервер;
- готовая папка `dist` для любого static hosting.

## Локальный запуск

Требуется Node.js 20+.

```bash
cd qa-career-hub
npm run update:jobs
npm run dev
```

Откройте `http://127.0.0.1:4173`.

Обновление вакансий предпочтительно запускать перед сборкой:

```bash
npm run update:jobs
npm run build
npm run preview
```

Готовый сайт окажется в `dist/`.

## LinkedIn без фиктивных данных

LinkedIn ограничивает неавторизованный автоматизированный сбор. По умолчанию блок показывает прямой публичный поиск и состояние «не подключено». Если у вас есть разрешённый API-провайдер, скопируйте `.env.example` в `.env` и задайте:

```dotenv
LINKEDIN_API_URL=https://provider.example/jobs
LINKEDIN_API_TOKEN=secret
```

Endpoint должен вернуть массив вакансий либо `{ "jobs": [...] }`. `.env` исключён из Git. Токен не попадает в браузерную сборку.

## Автоматическое обновление

Пример GitHub Actions (`.github/workflows/update.yml`):

```yaml
name: Refresh jobs
on:
  schedule:
    - cron: "17 */12 * * *"
  workflow_dispatch:
jobs:
  refresh:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm run update:jobs
      - run: npm run build
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "data: refresh official QA vacancies"
```

Каждый источник обрабатывается отдельно. Ошибка или 403 одного работодателя фиксируется в `update-report.json`, но не прерывает остальные. Закрытые вакансии исчезают из свежего snapshot; сохранённая ссылка остаётся только в LocalStorage пользователя.

Кнопка обновления в боковой панели вызывает `POST /api/refresh-jobs`: локальный сервер последовательно запускает сборщик и новую сборку. На полностью статическом хостинге обновление выполняется через CI по расписанию или командами `npm run update:jobs && npm run build`.

## Как сохраняется прогресс

Сайт автоматически записывает состояние в `localStorage` текущего браузера под ключом `qa-hub-state`: пройденные темы, статистику ответов, категорию и текущий вопрос сессии, а также избранные вакансии. Данные не отправляются на сервер и не синхронизируются между браузерами. Кнопка «Сбросить прогресс» очищает только обучение и тренажёр; избранные вакансии остаются.

## Деплой

- Netlify / Cloudflare Pages: build command `npm run build`, publish directory `dist`.
- Vercel: Framework Preset `Other`, build command `npm run build`, output directory `dist`.
- GitHub Pages: публикуйте содержимое `dist`.
- Обычный хостинг: загрузите содержимое `dist/` в web-root.

Для автоматического refresh на полностью статическом хостинге используйте CI по расписанию. Позже `scripts/update-jobs.mjs` можно перенести в serverless/cron и сохранять результат в БД без изменения UI-контракта.

### GitHub → Vercel / v0

1. Создайте на GitHub пустой репозиторий `qa-career-hub` без README и `.gitignore`.
2. В папке проекта выполните:

```bash
git init
git add .
git commit -m "Initial QA Career Hub"
git branch -M main
git remote add origin https://github.com/USERNAME/qa-career-hub.git
git push -u origin main
```

3. Для обычного хостинга Vercel откройте **Vercel Dashboard → Add New → Project**, импортируйте GitHub-репозиторий и укажите:
   - Framework Preset: `Other`;
   - Build Command: `npm run build`;
   - Output Directory: `dist`;
   - Install Command можно оставить автоматической.
4. Нажмите **Deploy**. Каждый push в `main` будет обновлять production, а другие ветки и pull request — создавать preview deployment.
5. Если хотите продолжать редактирование через v0: откройте v0, нажмите **+ → Import from GitHub**, выберите этот репозиторий, затем используйте **Publish / Deploy**. Проект появится и в Vercel Dashboard.

Важно: кнопка обновления вакансий работает напрямую при локальном запуске через `npm run preview`. В статическом Vercel deployment данные нужно обновлять до сборки — локально или GitHub Actions по расписанию — и коммитить обновлённый `src/data/jobs.js`.

## Структура

```text
src/app.js                 интерфейс и состояние
src/styles.css             дизайн
src/data/companies.js      реестр работодателей
src/data/jobs.js           автоматически обновляемый snapshot
src/data/curriculum.js     учебная база
src/data/questions.js      банк тренажёра
scripts/update-jobs.mjs    адаптеры источников и health-check
scripts/build.mjs          production-сборка
scripts/serve.mjs          локальный preview
```

## Важное ограничение

Официальные ATS и страницы работодателей меняются. Перед откликом всегда проверяйте дату, локацию, право на remote из Кипра и валюту компенсации на странице работодателя. Реестр специально не включает компании, которые были отфильтрованы как явно ориентированные на рынок РФ; окончательная due diligence остаётся обязательной.
