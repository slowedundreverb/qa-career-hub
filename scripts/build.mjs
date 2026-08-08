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
const repository = 'https://github.com/slowedundreverb/qa-career-hub';
const localCommits = [];
const remoteCommits = [];

try {
  const { stdout } = await execFileAsync('git', ['log', '--date=iso-strict', '--pretty=format:%H%x09%ad%x09%s'], { cwd: root });
  for (const line of stdout.trim().split('\n').filter(Boolean)) {
    const [sha, date, ...message] = line.split('\t');
    localCommits.push({ sha, date, message: message.join('\t') });
  }
} catch (error) {
  console.warn(`Local git history unavailable: ${error.message}`);
}

try {
  for (let page = 1; ; page += 1) {
    const response = await fetch(`https://api.github.com/repos/slowedundreverb/qa-career-hub/commits?per_page=100&page=${page}`, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'qa-career-hub-build' }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const rows = await response.json();
    remoteCommits.push(...rows.map((row) => ({
      sha: row.sha,
      date: row.commit?.committer?.date || row.commit?.author?.date,
      message: String(row.commit?.message || 'Update').split('\n')[0]
    })));
    if (rows.length < 100) break;
  }
} catch (error) {
  console.warn(`Public repository history unavailable: ${error.message}`);
}

const seen = new Set();
const history = [...localCommits, ...remoteCommits].filter((commit) => {
  if (!commit.sha || seen.has(commit.sha)) return false;
  seen.add(commit.sha);
  return true;
});
const commits = history.map((commit, index, all) => ({
  ...commit,
  shortSha: commit.sha.slice(0, 7),
  version: `1.${all.length - index - 1}`
}));

await writeFile(resolve(dist, 'versions.json'), JSON.stringify({ repository, commits }, null, 2));
console.log(`Build ready: ${dist}`);
