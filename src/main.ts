import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      exposedHeaders: ['Location'],
    },
  });
  app.set('trust proxy', true);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
