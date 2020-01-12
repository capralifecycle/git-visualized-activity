#!/bin/bash
set -eu

help_and_exit() {
  >&2 echo "Syntax: $0 <env> <cdk args>"
  exit 1
}

if [ $# -lt 1 ]; then
  help_and_exit
fi

env="$1"
shift

source .config

case "$env" in
  incubator)
    target=$TARGET_INCUBATOR
    profile=$PROFILE_INCUBATOR
    ;;
  *)
    help_and_exit
    ;;
esac

exec node_modules/.bin/cdk --context target="$target" --profile "$profile" "$@"
