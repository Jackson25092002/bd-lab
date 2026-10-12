import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { getRuntimeConfig } from './config/runtime.config.js';
import { existsSync } from 'node:fs';
import { setupApp } from './app.setup.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';

// Load local credentials before Nest constructs Prisma and storage services.
if (existsSync('.env')) process.loadEnvFile('.env');

async function bootstrap() {
  const config = getRuntimeConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.useBodyParser('json', { limit: '1mb' });
  setupApp(app);
  if (process.env.NODE_ENV !== 'production') {
    const definition = new DocumentBuilder()
      .setTitle('BD Lab API')
      .setDescription(
        'Giai đoạn 3 - hồ sơ, PDF và bản nháp. Chưa xác nhận hoặc cấp mã.',
      )
      .setVersion('0.3')
      .build();
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, definition),
    );
  }
  await app.listen(config.port, config.host);
}
await bootstrap();
