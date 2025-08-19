import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, ReadStream } from 'fs';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { User } from './generated/users';
import { parser as jsonParser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get an observable of filtered users
   */
  getFilteredUsers(): Observable<User> {
    const dataPath = this.configService.get<string>('USERS_DATA_PATH');

    return this.streamToObservable(createReadStream(dataPath, { encoding: 'utf8' })).pipe(
      filter((user) => user.age > 18),
    );
  }

  private streamToObservable(fileStream: ReadStream): Observable<User> {
    return new Observable<User>((subscriber) => {
      const parser = jsonParser();
      const arrayStream = streamArray();

      // pipe: file -> json parser -> streamArray
      fileStream.pipe(parser).pipe(arrayStream);

      // Emit each parsed user (arrayStream emits { key, value })
      arrayStream.on('data', (chunk: { key: number; value: unknown }) => {
        try {
          const rawUser = chunk.value as User;
          subscriber.next(this.transformUser(rawUser));
        } catch (err) {
          this.logger.error(`Transform error: ${(err as Error).message}`);
          subscriber.error(err);
        }
      });

      // Stream IO errors
      fileStream.once('error', (err: Error) => {
        this.logger.error(`Stream error: ${err.message}`);
        subscriber.error(err);
      });

      // JSON parse errors (parser + arrayStream)
      parser.once('error', (err: Error) => {
        this.logger.error(`JSON parse error (parser): ${err.message}`);
        subscriber.error(err);
      });
      arrayStream.once('error', (err: Error) => {
        this.logger.error(`JSON parse error (streamArray): ${err.message}`);
        subscriber.error(err);
      });

      // Stream end
      arrayStream.once('end', () => {
        this.logger.log('Finished reading users.json');
        subscriber.complete();
      });

      // Cleanup on unsubscribe
      return () => {
        try {
          fileStream.unpipe();
          fileStream.destroy?.();
          parser.destroy?.();
          arrayStream.destroy?.();
        } catch (e) {
          console.warn('Error during cleanup streams:', (e as Error).message);
        }
      };
    });
  }

  /**
   * Transform raw user object into gRPC-friendly type
   */
  private transformUser(rawUser: User): User {
    const { id, name, age, ...additional } = rawUser;
    return {
      id,
      name,
      age,
      additionalInfo: Object.keys(additional).length ? additional : undefined,
    };
  }
}
