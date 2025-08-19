This repository contains a simple NestJS-based GRPC microservices example. The goal is to demonstrate basic GRPC communication between two microservices: a **filter-service** and a **logger-service**.

The **filter-service** reads user data from a JSON file, filters users with age > 18 on the fly, and streams the filtered results to the **logger-service**.  
The **logger-service** calls **filter-service** via GRPC, receives the filtered users as a stream, and logs them to the console.  
Users can have any number of fields with arbitrary nesting.  
Both services share the same `users.proto` schema. The GRPC SDK is generated using protoc-gen-ts_proto.  


## GRPC API

**Service Name:** `UserService`
**RPC Method:** `GetFilteredUsers`

Defined in `users.proto`:

```syntax = "proto3";
package users;

import "google/protobuf/empty.proto";
import "google/protobuf/struct.proto";

service UserService {
  rpc GetFilteredUsers (google.protobuf.Empty) returns (stream User);
}

message User {
  int32 id = 1;
  string name = 2;
  int32 age = 3;
  // Untyped addon per-user
  google.protobuf.Struct additional_info = 4;
}

```

---

## Running the Services

## Docker

You can run both services using Docker and `docker-compose`:

```bash
docker-compose up --build
```

This will start both services in separate containers and enable GRPC communication.

## Local Run
### 1. Install dependencies

For both services:

```bash
cd filter-service
npm install
cd ../logger-service
npm install
```

### 2. Start the Producer service

```bash
cd filter-service
npm run start:dev
```

By default, the Producer runs on `localhost:50052`.

### 3. Start the Consumer service

```bash
cd logger-service
npm run start:dev
```

## Users JSON Example (`producer/src/data/users.json`):

```json
[
  { "id": 1, "name": "Alice",   "age": 59 },
  { "id": 2, "name": "Bob",     "age": 11 },
  { "id": 3, "name": "Charlie", "age": 0 },
  { "id": 4, "name": "Set",     "age": 28 },
  { "id": 5, "name": "Mike",    "age": 29 },
  { "id": 6,                    "age": 30 },
  {
    "id": 7,
    "name": "John",
    "age": 31,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "zip": "10001"
    }
  }
]
```
## Example of logger-service in action:
```
LOG [UsersService] {"id":1,"name":"Alice","age":59}
LOG [UsersService] {"id":4,"name":"Set","age":28}
LOG [UsersService] {"id":5,"name":"Mike","age":29}
LOG [UsersService] {"id":6,"age":30}
LOG [UsersService] {"id":7,"name":"John","age":31,"address":{"street":"123 Main St","city":"New York","zip":"10001"}}

```
---
## Environment Variables

**filter-service**:
* `FILTER_SERVICE_URL` – default: `0.0.0.0:50052`
* `USERS_DATA_PATH` – default: `./src/data/users.json`

**logger-service**:
* `FILTER_SERVICE_URL` – default: `0.0.0.0:50052`


## Notes
Used Libraries:
* **stream-json** – for parsing JSON files.
* **rxjs** – for streaming, filtering, and processing user data.
* **joi** – for validating environment variables.
* **grpc** – for communication between microservices.

After modifying the .proto file, run proto-gen.sh in the root folder of each service to regenerate the GRPC SDK  

End-to-end (E2E) tests for the filter-service can be run with: ```npm run test:e2e ```  
TODO: Add unit tests for both services.  
