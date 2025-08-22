import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { User } from './generated/users';
import { FileReaderService } from '../common/file-reader.service';
import { JsonStreamService } from '../common/json-stream.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly usersDataPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly fileReaderService: FileReaderService,
    private readonly jsonStreamService: JsonStreamService,
  ) {
    this.usersDataPath = this.configService.get<string>('USERS_DATA_PATH');
  }

  /**
   * Returns an Observable of users over 18 with transformed data.
   * Reads from JSON file defined in USERS_DATA_PATH.
   * @returns Observable<User> - A stream of parsed Users.
   */
  getFilteredUsers$(): Observable<User> {
    const fileStream = this.fileReaderService.getReadStream(this.usersDataPath);

    return this.jsonStreamService.parseJsonArray$<User>(fileStream).pipe(
      map(UsersService.transformUser),
      filter((user) => user.age > 18),
    );
  }

  /**
   * Transforms a raw user object into a gRPC-friendly format.
   * Any properties on the raw user object besides id, name, and age are
   * moved into the `additionalInfo` property.
   * @param rawUser - The raw user object to transform.
   * @returns The transformed user object.
   */
  private static transformUser(this: void, rawUser: User): User {
    const { id, name, age, ...additional } = rawUser;
    return {
      id,
      name,
      age,
      additionalInfo: Object.keys(additional).length ? additional : undefined,
    };
  }
}
