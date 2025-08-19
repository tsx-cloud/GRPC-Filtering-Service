#!/bin/bash

OUTPUT_FILE="users.json"
TARGET_SIZE=$((20 * 1024 * 1024)) # 100 MB
echo "[" > "$OUTPUT_FILE"

ID=1
BASE_NAMES=("Alice" "Bob" "Charlie" "Set")
FIRST=1

while true; do
  for NAME in "${BASE_NAMES[@]}"; do
    AGE=$((RANDOM % 100))
    USER_JSON="{ \"id\": $ID, \"name\": \"$NAME\", \"age\": $AGE }"

    if [ $FIRST -eq 1 ]; then
      echo "  $USER_JSON" >> "$OUTPUT_FILE"
      FIRST=0
    else
      echo "  ,$USER_JSON" >> "$OUTPUT_FILE"
    fi

    ID=$((ID + 1))

    if (( ID % 10000 == 0 )); then
      FILE_SIZE=$(stat -c%s "$OUTPUT_FILE")
      if [ $FILE_SIZE -ge $TARGET_SIZE ]; then
        break 2
      fi
    fi
  done
done

echo "]" >> "$OUTPUT_FILE"

echo "Generated $OUTPUT_FILE (~$(stat -c%s "$OUTPUT_FILE") bytes)"
