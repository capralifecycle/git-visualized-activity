#!/bin/bash
set -euo pipefail

# Lookup the 'latest' tag and find the dated tag for it.
version=$(
  aws ecr describe-images --repository-name git-visualized-activity/worker \
    | jq '.imageDetails | sort_by(.imagePushedAt) | (.[] | [(.imageTags | sort?), (.imagePushedAt | todate)])' \
    | jq 'select(.[0] | index($tag)) | .[0][]' -r --arg tag latest \
    | grep '^[0-9]\{8\}-' \
    | sort -n \
    | tail -1
)

sed -i "s/^app_image_tag=.\+\$/app_image_tag=$version/" sync-stack.sh
echo "Image is now $version"

echo "Preferred commit message: Update git-visualized-activity to latest"
