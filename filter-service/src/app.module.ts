import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { configValidationSchema } from './config/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // for e2e tests
      envFilePath: process.env.NODE_ENV === 'test' ? 'test/.env.test' : '.env',
      validationSchema: configValidationSchema,
    }),
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
