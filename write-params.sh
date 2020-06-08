#!/bin/bash
set -eu -o pipefail

echo "Please be sure you are authed to the correct AWS account before continuing."

printf "Enter GitHub token (input hidden): "
read -r -s token
echo

if [ -z "$token" ]; then
  echo "Aborting"
  exit
fi

# TODO: Switch to Secrets Manager.
# TODO: Tags.
aws ssm put-parameter \
  --name /incub-gva-worker/github-token \
  --description "Value set by write-params.sh" \
  --type SecureString \
  --value "$token" \
  --overwrite

echo "OK"
