import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  // In development, allow any localhost / 127.0.0.1 port — Vite picks an
  // arbitrary free port (5174, 5175, …) when the default is taken, and we
  // don't want CORS to silently break the frontend. In production, only the
  // exact WEB_ORIGIN is allowed.
  const isDev = config.get<string>('NODE_ENV', 'development') !== 'production';
  const webOrigin = config.get<string>('WEB_ORIGIN', 'http://localhost:1995');
  app.enableCors({
    origin: isDev
      ? (origin, cb) => {
          if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return cb(null, true);
          }
          return cb(null, false);
        }
      : webOrigin,
    credentials: true,
  });

  const port = config.get<number>('API_PORT', 1109);
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
