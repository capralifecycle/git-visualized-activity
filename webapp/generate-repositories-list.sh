#!/bin/bash
set -eu -o pipefail

cd "$1"

find . -maxdepth 2 -type d -name .git -print0 \
| while IFS= read -r -d '' line; do
  (
    cd "$line/.."
    echo "$(basename "$PWD"),$(git rev-parse --abbrev-ref HEAD),unknown"
  )

done
