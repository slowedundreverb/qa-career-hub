import { execFile } from 'node:child_process';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'index.html'), resolve(dist, 'index.html'));
await cp(resolve(root, 'src'), resolve(dist, 'src'), { recursive: true });
await cp(resolve(root, 'README.md'), resolve(dist, 'README.md'));
try {
  const { stdout } = await execFileAsync('git', ['log', '--date=iso-strict', '--pretty=format:%H%x09%ad%x09%s'], { cwd: root });
  const commits = stdout.trim().split('\n').filter(Boolean).map((line, index, all) => {
    const [sha, date, ...message] = line.split('\t');
    return {
      sha,
      shortSha: sha.slice(0, 7),
      date,
      message: message.join('\t'),
      version: `1.${all.length - index - 1}`
    };
  });
  await writeFile(resolve(dist, 'versions.json'), JSON.stringify({
    repository: 'https://github.com/slowedundreverb/qa-career-hub',
    commits
  }, null, 2));
} catch (error) {
  console.warn(`Local git history unavailable; loading the public repository history instead: ${error.message}`);
  try {
    const response=await fetch('https://api.github.com/repos/slowedundreverb/qa-career-hub/commits?per_page=100',{headers:{accept:'application/vnd.github+json','user-agent':'qa-career-hub-build'}});
    if(!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const rows=await response.json();
    const commits=rows.map((row,index,all)=>({
      sha:row.sha,
      shortSha:row.sha.slice(0,7),
      date:row.commit?.committer?.date||row.commit?.author?.date,
      message:String(row.commit?.message||'Update').split('\n')[0],
      version:`1.${all.length-index-1}`
    }));
    await writeFile(resolve(dist,'versions.json'),JSON.stringify({repository:'https://github.com/slowedundreverb/qa-career-hub',commits},null,2));
  } catch(fallbackError) {
    console.warn(`Version history unavailable: ${fallbackError.message}`);
    await writeFile(resolve(dist, 'versions.json'), JSON.stringify({ repository: '', commits: [] }));
  }
}
console.log(`Build ready: ${dist}`);
