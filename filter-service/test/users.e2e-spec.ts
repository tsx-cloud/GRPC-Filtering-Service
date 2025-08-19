import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/generated/users';
import { ConfigService } from '@nestjs/config';

interface UserServiceClient extends grpc.Client {
  getFilteredUsers(data: {}): grpc.ClientReadableStream<User>;
}

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let client: UserServiceClient;

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
        protoPath: join(__dirname, 'users.proto'),
        url: filterServiceUrl,
        loader: {
          includeDirs: [__dirname],
        },
      },
    });

    await app.startAllMicroservices();
    await app.init();

    const packageDefinition = protoLoader.loadSync(
      join(__dirname, 'users.proto'),
      {
        includeDirs: [__dirname],
      },
    );
    const protoGRPC = grpc.loadPackageDefinition(packageDefinition) as any;

    client = new protoGRPC.users.UserService(
      filterServiceUrl,
      grpc.credentials.createInsecure(),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return a stream of users from the test file', (done) => {
    const users: User[] = [];
    const call = client.getFilteredUsers({});
    
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

