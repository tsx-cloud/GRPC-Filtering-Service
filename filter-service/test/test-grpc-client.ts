/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { join } from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { User } from '../src/users/generated/users';

/**
 * gRPC client interface for FilterService.
 * This interface is manually defined based on the `user.proto` file
 */
export interface FilterServiceClient extends grpc.Client {
  getFilteredUsers(data: object): grpc.ClientReadableStream<User>;
}

/**
 * Creates and returns a gRPC client instance for the FilterService.
 * The returned client is manually typed as FilterServiceClient based on the `user.proto` file.
 * The client connects to the gRPC server using the provided URL.
 *
 * @param filterServiceUrl - The URL of the gRPC filter service.
 * @returns A FilterServiceClient instance (manually defined from `user.proto`).
 */
export function createGrpcClient(filterServiceUrl: string): FilterServiceClient {
  const packageDefinition = protoLoader.loadSync(join(__dirname, '../../proto/users/users.proto'), {
    includeDirs: [join(__dirname, '../../proto/users')],
  });

  const protoGRPC = grpc.loadPackageDefinition(packageDefinition) as any;
  return new protoGRPC.users.UserService(filterServiceUrl, grpc.credentials.createInsecure());
}
