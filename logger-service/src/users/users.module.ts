import { Module } from '@nestjs/common';
import { ClientsModule, Transport, ClientProviderOptions } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'USER_PACKAGE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const filterServiceUrl = configService.get<string>('FILTER_SERVICE_URL');
          return {
            transport: Transport.GRPC,
            options: {
              url: filterServiceUrl,
              package: 'users',
              protoPath: join(__dirname, '../../../proto/users/users.proto'),
            },
          } as ClientProviderOptions;
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [UsersService],
})
export class UsersModule {}
