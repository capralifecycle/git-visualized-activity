#!/bin/bash
set -eu -o pipefail

stats_remove_blank_lines() {
  cat - | grep -a -E '.+'
}

stats_merge_shortstats() {
  # --shortstats gives a stats line on a separate line, and only
  # if there is actually anything to report (e.g. often missing for merges).
  # This processes all this so that all lines have stats, then merge the
  # lines so that the end result is one line for each commit.
  cat - \
    | perl -pe 's/^ (\d+) file(?:.+?(\d+) insert)?(?:.+?(\d+) dele)?.+$/\1,\2,\3/' \
    | awk '{ print $0; if (NF > 3) print ",," }' \
    | perl -pe 'BEGIN{undef $/;} s/^,,\n(\d*,\d*,\d*)$/\1/smg' \
    | awk '!(NR%2) { print $0 "," p } !((NR-1)%2) { p=$0 }'
}

stats_convert_merges_to_flag() {
  cat - \
    | perl -pe 's/<\S*>/n/' \
    | perl -pe 's/<[\S ]+>/y/'
}

stats_fix_numbers() {
  cat - \
    | perl -pe 's/^,/0,/' \
    | perl -pe 's/^(\d+),,/\1,0,/' \
    | perl -pe 's/^(\d+),(\d+),,/\1,\2,0,/'
}

trim_long_lines() {
  # some commit messages are extremely long (we are talking over 100 000 chars
  # in the subject line!)
  cat - \
    | cut -c 1-200
}

get_repo_stats() {
  local branch=$1

  # Some magic to normalize output and reformat the log.
  git log \
    --format='%h,<%p>,%ai,%aN,%s' \
    --shortstat $branch \
    --use-mailmap \
    | trim_long_lines \
    | stats_remove_blank_lines \
    | stats_merge_shortstats \
    | stats_convert_merges_to_flag \
    | stats_fix_numbers

  # Output columns:
  # - files changed
  # - lines inserted
  # - lines deleted
  # - short commit id
  # - merge? (y/n)
  # - timestamp
  # - author name
  # - commit subject
}

process_group() {
  local repo_list_file=$1
  local repo_parent=$2
  local owner=$3

  for spec in $(cat "$repo_list_file"); do
    repo=$(echo "$spec" | cut -f1 -d,)
    branch=$(echo "$spec" | cut -f2 -d,)
    project=$(echo "$spec" | cut -f3 -d,)

    >&2 echo "Extracting stats from $owner/$repo ($branch)"

    (
      cd "$repo_parent/$repo"

      # Verify remote is as expected
      if ! [[ $(git remote get-url origin) =~ github.com ]]; then
        echo "Remote origin does not have expected URL."
        echo "Actual value: $(git remote get-url origin)"
        exit 1
      fi

      get_repo_stats $branch \
        | sed "s#^#$owner,$repo,$project,#"
    )
  done
}

refresh_stale_repos() {
  local repo_list_file=$1
  local root=$2

  for spec in $(cat "$repo_list_file"); do
    (
      repo=$(echo "$spec" | cut -f1 -d,)
      cd "$root/$repo"

      age=9999999
      if [ -f .git/FETCH_HEAD ]; then
        age=$(( $(date +%s) - $(stat -c %Y .git/FETCH_HEAD) ))
      elif [ -f .git/refs/remotes/origin/HEAD ]; then
        age=$(( $(date +%s) - $(stat -c %Y .git/refs/remotes/origin/HEAD) ))
      fi

      if [ $age -gt 86400 ]; then
        echo "Fetching stale repo $repo (age: $age seconds)"
        git fetch origin
        git remote prune origin
      fi
    )
  done
}

show_syntax() {
  echo "Syntax:"
  echo "  $0 clean"
  echo "  $0 add-group <repo-list.csv> <owner> <repo-parent-directory>"
}

cmd="${1:-}"

if [ "$cmd" == "clean" ]; then
  [ -f commits.csv ] && rm commits.csv
  echo 'owner,repo,project,files_changed,lines_inserted,lines_deleted,commit,is_merge,timestamp,author_name,subject' >>commits.csv
  exit
fi

if [ "$cmd" == "add-group" ]; then
  repo_list="$2"
  repo_owner="$3"
  repo_parent_root="$4"

  refresh_stale_repos "$repo_list" "$repo_parent_root"
  process_group "$repo_list" "$repo_parent_root" "$repo_owner" >>commits.csv
  exit
fi

show_syntax
exit 1
