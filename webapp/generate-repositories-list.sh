#!/bin/bash
set -eu -o pipefail

cd "$1"

for dir in */.git; do
  (
    cd "$dir/.."
    echo "$(basename "$PWD"),$(git rev-parse --abbrev-ref HEAD),unknown"
  )
done
