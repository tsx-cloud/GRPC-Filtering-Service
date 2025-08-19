import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);

  //url for gRPC server
  const filterServiceUrl = configService.get<string>('FILTER_SERVICE_URL');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'users',
      protoPath: join(__dirname, '../../proto/users/users.proto'),
      url: filterServiceUrl,
    },
  });

  app.enableShutdownHooks();
  await app.listen();
}
void bootstrap();
