#!/usr/bin/env bash
# Davie3/ryot fork: replay this branch's fork commits onto an upstream release tag.
# Usage: ci/fork-rebase.sh <upstream-tag>
# Exits non-zero if the commits no longer apply or the core-details change is missing afterwards.
# The body sits in a function so bash has read all of it before the rebase rewrites this file.
set -euo pipefail

main() {
  local tag="$1" base
  git fetch --no-tags --force https://github.com/IgnisDa/ryot.git '+refs/tags/v*:refs/tags/v*'
  base=$(git describe --tags --abbrev=0 --match 'v[0-9]*' HEAD)
  if [[ "$base" != "$tag" ]]; then
    echo "Rebasing fork commits from $base onto $tag"
    git -c user.name=fork-ci -c user.email=fork-ci@users.noreply.github.com \
      rebase --onto "$tag" "$base"
  fi
  grep -q 'is_server_key_validated: true,' crates/utils/dependent/core/src/lib.rs
  git log --oneline "$tag..HEAD"
}

main "$@"
