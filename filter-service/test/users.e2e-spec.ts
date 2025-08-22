import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/generated/users';
import { ConfigService } from '@nestjs/config';
import { FilterServiceClient, createGrpcClient } from './test-grpc-client';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let grpcClient: FilterServiceClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const configService = app.get(ConfigService);
    const filterServiceUrl = configService.get<string>('FILTER_SERVICE_URL');

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options: {
        package: 'users',
        protoPath: join(__dirname, '../../proto/users/users.proto'),
        url: filterServiceUrl,
        loader: {
          includeDirs: [join(__dirname, '../../proto/users')],
        },
      },
    });

    await app.startAllMicroservices();
    await app.init();

    grpcClient = createGrpcClient(filterServiceUrl);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return a stream of users from the test file', (done) => {
    const users: User[] = [];
    const call = grpcClient.getFilteredUsers({});
    call.on('data', (user: User) => {
      users.push(user);
    });
    call.on('end', () => {
      console.log(users);
      expect(users.length).toBe(4);
      expect(users[0].name).toBe('Alice');
      expect(users[1].name).toBe('Set');
      expect(users[1].additionalInfo).toBeUndefined();
      expect(users[2].name).toBeUndefined();
      expect(users[3].additionalInfo).toBeDefined();
      done();
    });
    call.on('error', (error) => {
      done(error);
    });
  });
});
