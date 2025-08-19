import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { map, Observable, tap } from 'rxjs';
import { UserServiceClient, USER_SERVICE_NAME, User } from './generated/users';
import { ServiceError } from '@grpc/grpc-js';

@Injectable()
export class UsersService implements OnModuleInit {
  private userService: UserServiceClient;
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject('USER_PACKAGE')
    private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);

    this.loadFilteredUsers();
  }

  /**
   * Loads filtered users from gRPC service and processes each user.
   * - Unpacks additionalInfo to top level
   * - Logs each user
   */
  private loadFilteredUsers() {
    const users$: Observable<User> = this.userService.getFilteredUsers({});
    users$
      .pipe(
        map((user) => this.unpackAdditionalInfo(user)),
        tap((user) => this.logger.log(JSON.stringify(user))),
      )
      .subscribe({
        error: (err: ServiceError) => this.logger.error(`gRPC Error [${err.code}]: ${err.details || err.message}`),
        complete: () => this.logger.log('Stream completed. All users received.'),
      });
  }

  /**
   * If user has `additionalInfo`, merge it into top-level fields.
   * @param user User object from gRPC
   * @returns User with additionalInfo unpacked
   */
  private unpackAdditionalInfo(user: User): User {
    if (!user.additionalInfo) return user;

    const mergedUser = {
      ...user,
      ...user.additionalInfo,
    };
    delete mergedUser.additionalInfo;
    return mergedUser;
  }
}
