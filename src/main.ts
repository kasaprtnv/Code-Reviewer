import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import SmeeClient from 'smee-client';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  await app.listen(process.env.PORT ?? 3000);
  app.useLogger(app.get(Logger));

  if (process.env.NODE_ENV === 'development') {
    const smee = new SmeeClient({
      source: process.env.SMEE_SOURCE!,
      target: `http://localhost:${process.env.PORT ?? 3000}/webhook`,
      logger: console,
    });
    smee.start();
  }
}
bootstrap();
