const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '..', 'frontend');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0) process.exit(res.status);
}

try {
  console.log('Installing frontend dependencies...');
  run('npm', ['install', '--no-audit', '--no-fund'], { cwd: frontendDir });

  console.log('Building frontend...');
  run('npm', ['run', 'build'], { cwd: frontendDir });

  const src = path.join(frontendDir, 'build');
  const dest = path.join(process.cwd(), 'build');
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  console.log('Copying frontend/build -> ./build');
  fs.cpSync(src, dest, { recursive: true });
  console.log('Frontend build completed.');
} catch (err) {
  console.error('Failed to build frontend:', err);
  process.exit(1);
}
