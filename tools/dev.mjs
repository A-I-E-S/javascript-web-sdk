import { spawn, spawnSync } from 'node:child_process';

const initial = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
if (initial.status !== 0) process.exit(initial.status ?? 1);

const children = [
  spawn('npm', ['run', 'dev:styles'], { stdio: 'inherit' }),
  spawn(process.execPath, ['tools/serve-playground.mjs'], { stdio: 'inherit' })
];

let stopping = false;
function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill(signal);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => stop(signal));
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (!stopping && code !== 0) {
      stop();
      process.exitCode = code ?? (signal ? 1 : 0);
    }
  });
}

await Promise.all(children.map((child) => new Promise((resolve) => child.on('exit', resolve))));
