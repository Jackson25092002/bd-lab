import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

if (existsSync('.env')) process.loadEnvFile('.env');
const connection = new URL(process.env.TEST_DATABASE_URL ?? '');
if (!['localhost', '127.0.0.1'].includes(connection.hostname) || connection.pathname !== '/bd_lab_test') throw new Error('Test chỉ chạy trên database local bd_lab_test.');
const result = spawnSync(process.execPath, [resolve('../node_modules/prisma/build/index.js'), 'migrate', 'deploy'], { stdio: 'inherit', windowsHide: true, env: { ...process.env, DATABASE_URL: connection.toString() } });
process.exitCode = result.status ?? 1;
