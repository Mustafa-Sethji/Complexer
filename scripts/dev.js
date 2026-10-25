// Starts the Express API and Vite frontend together with one `npm start`.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';

const major = Number(process.versions.node.split('.')[0]);
if (major < 18) {
  console.error(`Node.js 18+ is required (you have ${process.versions.node}).`);
  process.exit(1);
}

for (const dir of ['backend', 'frontend']) {
  const cwd = path.join(root, dir);
  const marker = dir === 'backend' ? 'express' : 'vite';
  if (!fs.existsSync(path.join(cwd, 'node_modules', marker))) {
    console.log(`\n[setup] Installing ${dir} dependencies...`);
    const result = spawnSync(npm, ['install'], {
      cwd,
      stdio: 'inherit',
      shell: isWin,
    });
    if (result.status !== 0) {
      console.error(`[setup] npm install failed in ${dir}/. Fix the error above and retry.`);
      process.exit(result.status || 1);
    }
  }
}

function freePort(port) {
  try {
    if (isWin) {
      const result = spawnSync('cmd', ['/c', `netstat -ano | findstr :${port} | findstr LISTENING`], { encoding: 'utf8' });
      const output = result.stdout || '';
      const pids = new Set(output.split('\n').map(line => line.trim().split(/\s+/).pop()).filter(pid => /^\d+$/.test(pid)));
      for (const pid of pids) spawnSync('taskkill', ['/pid', pid, '/F'], { stdio: 'ignore' });
    } else {
      const result = spawnSync('sh', ['-c', `lsof -ti tcp:${port} -sTCP:LISTEN`], { encoding: 'utf8' });
      for (const pid of (result.stdout || '').split('\n').filter(Boolean)) {
        try { process.kill(Number(pid), 'SIGTERM'); } catch (_) {}
      }
    }
  } catch (error) {
    console.warn(`[start] Could not check port ${port}: ${error.message}`);
  }
}

// Clear stale copies so requests do not accidentally hit an older server.
[4000, 5173].forEach(freePort);

const children = [];
let stopping = false;
function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child && !child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(exitCode), 300);
}

function start(name, args, cwd) {
  console.log(`[start] Launching ${name}...`);
  const child = spawn(npm, args, { cwd, stdio: 'inherit', shell: isWin });
  children.push(child);
  child.on('error', error => {
    console.error(`[${name}] Failed to start: ${error.message}`);
    stopAll(1);
  });
  child.on('exit', code => {
    if (!stopping) {
      console.error(`[${name}] exited with code ${code}. Stopping the application.`);
      stopAll(code || 1);
    }
  });
  return child;
}

console.log('\n[start] Starting Complexity Analyzer');
console.log('[start] API: http://127.0.0.1:4000');
console.log('[start] UI:  http://localhost:5173\n');
start('backend', ['start'], path.join(root, 'backend'));
start('frontend', ['run', 'dev'], path.join(root, 'frontend'));

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
