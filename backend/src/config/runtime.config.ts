export function getRuntimeConfig() {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT phải là số nguyên trong khoảng 1–65535.');
  }
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5174';
  const url = new URL(corsOrigin);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.origin !== corsOrigin
  ) {
    throw new Error('CORS_ORIGIN phải là origin HTTP(S), không có path.');
  }
  return { port, host: process.env.HOST ?? '127.0.0.1', corsOrigin };
}
