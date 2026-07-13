import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectJobs } from './update-jobs.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.argv[2] === 'dist' ? join(root, 'dist') : root;
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml' };
let refreshPromise = null;

async function refreshSnapshot() {
  const result=await collectJobs();
  return {
    jobs:result.jobs,
    linkedinJobs:result.linkedinJobs,
    meta:result.meta,
    count:result.jobs.length,
    warnings:result.report.errors.length
  };
}

const server = createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (pathname === '/api/refresh-jobs') {
      if (req.method !== 'POST') { res.writeHead(405, {'content-type':'application/json'}); res.end(JSON.stringify({error:'Method not allowed'})); return; }
      if (!refreshPromise) refreshPromise = refreshSnapshot().finally(() => { refreshPromise = null; });
      const result = await refreshPromise;
      res.writeHead(200, {'content-type':'application/json','cache-control':'no-store'});
      res.end(JSON.stringify(result));
      return;
    }
    let file = join(base, pathname === '/' ? 'index.html' : pathname);
    if (!(await stat(file)).isFile()) file = join(base, 'index.html');
    res.writeHead(200, {'content-type': types[extname(file)] || 'application/octet-stream','cache-control':'no-cache'});
    res.end(await readFile(file));
  } catch (error) {
    if (req.url?.startsWith('/api/')) { res.writeHead(500, {'content-type':'application/json'}); res.end(JSON.stringify({error:error.message})); return; }
    res.writeHead(404); res.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`QA Career Hub: http://127.0.0.1:${port}`));
