import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { UserServiceController, UserServiceControllerMethods, User } from './generated/users';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Empty } from './generated/google/protobuf/empty';

@Controller('users')
@UserServiceControllerMethods()
export class UsersController implements UserServiceController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod('UserService', 'GetFilteredUsers')
  getFilteredUsers(_request: Empty): Observable<User> {
    return this.usersService.getFilteredUsers().pipe(
      catchError((err: Error) => {
        this.logger.error(`Error while getting filtered users: ${err.message}`);
        return throwError(() => err);
      }),
    );
  }
}
