import { existsSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error('TEST_DATABASE_URL chưa được cấu hình.');
const connection = new URL(testUrl);
if (
  !['localhost', '127.0.0.1'].includes(connection.hostname) ||
  connection.pathname !== '/bd_lab_test'
)
  throw new Error('Test chỉ chạy trên database local bd_lab_test.');
process.env.DATABASE_URL = testUrl;
process.env.LOCAL_UPLOAD_DIR = '../.local/test-uploads';
process.env.ENABLE_DEMO_FIXTURES = 'true';
process.env.NODE_ENV = 'test';
