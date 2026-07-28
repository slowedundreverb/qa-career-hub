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
  console.warn(`Version history unavailable: ${error.message}`);
  await writeFile(resolve(dist, 'versions.json'), JSON.stringify({ repository: '', commits: [] }));
}
console.log(`Build ready: ${dist}`);
