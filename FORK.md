# Davie3/ryot fork

Upstream [IgnisDa/ryot](https://github.com/IgnisDa/ryot) with a small core-details change,
published as `ghcr.io/davie3/ryot` (amd64 only).

## Branches

- `main`: protected by the `Lock main` ruleset. Changes land only as pull requests merged by a
  repo admin; direct pushes, force-pushes and deletion are blocked. Upstream is read from the
  `upstream` remote.
- `fork` (default branch): an upstream release tag plus the fork's commits:
  1. `core_details` in `crates/utils/dependent/core/src/lib.rs` sets
     `is_server_key_validated: true`. The backend and frontend read that flag, so nothing
     else changes.
  2. this file, `ci/fork-rebase.sh` and `.github/workflows/fork-image.yml`.

Upstream's own workflows are disabled in this repo's Actions settings.

## Image builds

`fork-image.yml` runs daily (and on demand). It takes the newest upstream `vX.Y.Z` tag and
exits if `ghcr.io/davie3/ryot:vX.Y.Z` already exists. Otherwise it replays the fork commits
onto that tag in the runner (`ci/fork-rebase.sh`), builds, starts the image against a
scratch Postgres, checks `coreDetails` reports the tag and `isServerKeyValidated: true`,
and only then pushes `vX.Y.Z`, `vX.Y` and `vX`. Floating tags never move to an older
release. There is no `latest` tag, so a new major is opt-in.

If the commits stop applying or the smoke test fails, the run fails and nothing is pushed.

## Syncing by hand

Only needed when a run fails on a conflict, or to move the branch base forward:

```sh
git fetch upstream --tags
git rebase --onto vNEW "$(git describe --tags --abbrev=0 --match 'v[0-9]*' fork)" fork
# resolve conflicts, keep `is_server_key_validated: true,`
git push --force-with-lease origin fork
```

Then re-run the workflow (`gh workflow run fork-image.yml -R Davie3/ryot`).
