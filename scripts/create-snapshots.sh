#!/bin/bash
set -eu -o pipefail
rm -rf cdk.out __snapshots__
npm run cdk -- synth
node_modules/.bin/cdk-create-snapshots cdk.out __snapshots__
