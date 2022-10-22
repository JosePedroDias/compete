import { spawn } from 'node:child_process';

/*
npm run build-server

node dist-server/benchmark/bots.js tictactoe 2
node dist-server/benchmark/bots.js snake 5
node dist-server/benchmark/bots.js gofish 2
*/

const processes = [];

const args = process.argv
  .slice(2)
  .map((n: any) => (isFinite(n) ? parseInt(n, 10) : n));

const [gameName, nrInstances] = args;

const cmd = `npm run run-bot-${gameName}`;

for (let i = 0; i < nrInstances; ++i) {
  console.log(`#${i} ${cmd}`);

  const parts = cmd.split(' ');

  const proc = spawn(parts[0], parts.slice(1), { cwd: process.cwd() });

  if (i === 0) {
    proc.stdout.on('data', (data) => {
      console.log(`#${i} OUT: ${data}`);
    });

    proc.stderr.on('data', (data) => {
      console.error(`#${i} ERR: ${data}`);
    });
  }

  proc.on('exit', (code) => {
    console.log(`Child process exited with exit code ${code}`);
  });

  processes.push(proc);
}

export {};
