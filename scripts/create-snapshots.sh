#!/bin/bash
set -eu -o pipefail

process() {
  target=$1
  app=$2
  dir=$3

  echo "-- Processing $target ($app) --"
  rm -rf cdk.out

  IS_SNAPSHOT=true ./cdk.sh "$target" "$app" synth >/dev/null

  # Transform the manifest to be more snapshot friendly.
  node ./scripts/transform-manifest.js cdk.out/manifest.json

  cp -rp cdk.out $dir

  # The tree file doesn't give us much value as part of the snapshot.
  rm "$dir/tree.json"

  # Remove asset contents for now.
  rm -rf "$dir/asset."*
}

# Wipe previous snapshots as we are overwriting it.
rm -rf __snapshots__
mkdir __snapshots__

time process incubator build __snapshots__/incubator-buid
time process incubator main __snapshots__/incubator-main
