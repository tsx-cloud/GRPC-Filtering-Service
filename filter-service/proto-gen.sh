#!/bin/bash

PROTO_DIR=./../proto/users
OUT_DIR=./src/users/generated

mkdir -p $OUT_DIR

npx protoc \
  --plugin=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=$OUT_DIR \
  --ts_proto_opt=nestJs=true,addGrpcMetadata=true,forceLong=bigint,outputServices=grpc-js \
  -I $PROTO_DIR $PROTO_DIR/*.proto
