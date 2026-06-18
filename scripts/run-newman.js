#!/usr/bin/env node
const { spawnSync } = require('child_process');

const env = process.argv[2] || 'local';

function run(command) {
  console.log(`\n$ ${command}`);
  const result = spawnSync(command, { stdio: 'inherit', shell: true });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status);
  }
}

function safeRun(command) {
  try {
    run(command);
  } catch (error) {
    // ignore cleanup failures
  }
}

function ensureDockerExists() {
  const result = spawnSync('docker --version', { stdio: 'ignore', shell: true });
  if (result.error || result.status !== 0) {
    console.error('\nERROR: Docker is not installed or not available in PATH.');
    console.error('Please install Docker Desktop and ensure the docker command is accessible.');
    console.error('Then rerun: npm run test:docker\n');
    process.exit(1);
  }
}

if (env === 'mock') {
  run('npm run test:mock');
} else if (env === 'local') {
  run('npm run test:local');
} else if (env === 'docker') {
  run('docker build -t fit4110/iot-ingestion:lab04 .');
  run('docker run -d --rm --name fit4110-iot-lab04 -p 8000:8000 --env-file .env.example fit4110/iot-ingestion:lab04');

  const cleanup = () => {
    safeRun('docker stop fit4110-iot-lab04');
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(1);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(1);
  });

  run('npx wait-on http://localhost:8000/health --timeout 30000');
  run('npm run test:local');
} else {
  console.error('Usage: node scripts/run-newman.js [mock|local|docker]');
  process.exit(1);
}
