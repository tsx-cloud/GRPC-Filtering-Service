import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { UsersService } from './users.service';
import { FileReaderService } from '../common/file-reader.service';
import { JsonStreamService } from '../common/json-stream.service';
import { User } from './generated/users';
import { ReadStream } from 'fs';

describe('UsersService', () => {
  let service: UsersService;
  let configService: ConfigService;
  let fileReaderService: FileReaderService;
  let jsonStreamService: JsonStreamService;

  const mockUsersDataPath = '/path/to/mock/users.json';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockUsersDataPath),
          },
        },
        {
          provide: FileReaderService,
          useValue: {
            getReadStream: jest.fn(),
          },
        },
        {
          provide: JsonStreamService,
          useValue: {
            parseJsonArray$: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
    fileReaderService = module.get<FileReaderService>(FileReaderService);
    jsonStreamService = module.get<JsonStreamService>(JsonStreamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFilteredUsers$', () => {
    let mockReadStream: ReadStream;

    beforeEach(() => {
      mockReadStream = {} as ReadStream;
      (fileReaderService.getReadStream as jest.Mock).mockReturnValue(mockReadStream);
    });

    it('should return users older than 18 and apply transformation', (done) => {
      const usersFromStream = [
        { id: 1, name: 'Alice', age: 20 },
        { id: 2, name: 'Bob', age: 18 },
        { id: 3, name: 'Charlie', age: 30, extra: 'data' },
      ];
      (jsonStreamService.parseJsonArray$ as jest.Mock).mockReturnValue(of(...usersFromStream));

      service.getFilteredUsers$().subscribe({
        next: (user) => {
          try {
            if (user.id === 1) {
              expect(user).toEqual({ id: 1, name: 'Alice', age: 20 });
            } else if (user.id === 3) {
              expect(user).toEqual({
                id: 3,
                name: 'Charlie',
                age: 30,
                additionalInfo: { extra: 'data' },
              });
            }
          } catch (error) {
            done(error);
          }
        },
        complete: () => {
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(configService.get).toHaveBeenCalledWith('USERS_DATA_PATH');
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(fileReaderService.getReadStream).toHaveBeenCalledWith(mockUsersDataPath);
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(jsonStreamService.parseJsonArray$).toHaveBeenCalledWith(mockReadStream);
          done();
        },
        error: done,
      });
    });

    it('should filter out users 18 or younger', (done) => {
      const usersFromStream: User[] = [
        { id: 1, name: 'Alice', age: 18 },
        { id: 2, name: 'Bob', age: 12 },
        { id: 3, name: 'Charlie', age: 19 },
      ];
      const expectedUsers: User[] = [
        { id: 3, name: 'Charlie', age: 19 }, // Only Charlie should pass
      ];
      (jsonStreamService.parseJsonArray$ as jest.Mock).mockReturnValue(of(...usersFromStream));

      const receivedUsers: User[] = [];
      service.getFilteredUsers$().subscribe({
        next: (user) => receivedUsers.push(user),
        complete: () => {
          try {
            expect(receivedUsers.length).toBe(1);
            expect(receivedUsers).toEqual(expectedUsers);
            done();
          } catch (error) {
            done(error);
          }
        },
        error: done,
      });
    });

    it('should propagate errors from jsonStreamService', (done: jest.DoneCallback) => {
      const mockError = new Error('JSON parsing error');
      (jsonStreamService.parseJsonArray$ as jest.Mock).mockReturnValue(throwError(() => mockError));

      service.getFilteredUsers$().subscribe({
        next: (): void => {
          done.fail(new Error('Should not emit any value'));
        },
        error: (err: unknown): void => {
          expect(err).toBe(mockError);
          done();
        },
        complete: (): void => {
          done.fail(new Error('Should not complete'));
        },
      });
    });

    it('should propagate errors from fileReaderService (indirectly via jsonStreamService)', (done: jest.DoneCallback) => {
      const mockError = new Error('File read error');
      (jsonStreamService.parseJsonArray$ as jest.Mock).mockReturnValue(throwError(() => mockError));

      service.getFilteredUsers$().subscribe({
        next: (): void => {
          done.fail(new Error('Should not emit any value'));
        },
        error: (err: unknown): void => {
          expect(err).toBe(mockError);
          done();
        },
        complete: (): void => {
          done.fail(new Error('Should not complete'));
        },
      });
    });
  });
});
