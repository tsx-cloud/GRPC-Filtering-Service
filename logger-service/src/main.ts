import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * This is a simple standalone application that starts,
 * receives data from the filter-service, and then closes.
 * This function initializes the application context and sets up signal handlers for fast shutdown.
 */
async function bootstrap() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const app = await NestFactory.createApplicationContext(AppModule);

  process.on('SIGINT', () => {
    console.log('SIGINT received, forcing app to close...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, forcing app to close...');
    process.exit(0);
  });
}
void bootstrap();
