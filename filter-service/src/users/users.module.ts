import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FileReaderService } from '../common/file-reader.service';
import { JsonStreamService } from '../common/json-stream.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, FileReaderService, JsonStreamService],
})
export class UsersModule {}
