import { Injectable } from '@nestjs/common';
import { createReadStream, ReadStream } from 'fs';

@Injectable()
export class FileReaderService {
  getReadStream(path: string): ReadStream {
    return createReadStream(path, { encoding: 'utf8' });
  }
}
