import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const app = await NestFactory.createApplicationContext(AppModule);

  process.on('SIGINT', () => {
    console.log('SIGTERM received, forcing app to close...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, forcing app to close...');
    process.exit(0);
  });
}
void bootstrap();
