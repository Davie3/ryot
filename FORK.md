# Davie3/ryot fork

Upstream [IgnisDa/ryot](https://github.com/IgnisDa/ryot) with a small core-details change,
published as `ghcr.io/davie3/ryot` (amd64 only).

## Branch

`fork` is the default and only branch: upstream releases merged in, plus the fork's commits:

1. `core_details` in `crates/utils/dependent/core/src/lib.rs` sets
   `is_server_key_validated: true`. The backend and frontend read that flag, so nothing
   else changes.
2. this file and the two `fork-*.yml` workflows.

There is no `main`: upstream is read from the `upstream` remote, and the `Lock main` ruleset
stops a `main` branch being created here. Upstream's own workflows are disabled in this
repo's Actions settings.

## Upstream releases

`fork-sync.yml` runs daily. When upstream has a `vX.Y.Z` tag that `fork` doesn't contain, it
pushes that tag as branch `sync/vX.Y.Z` and opens a PR into `fork`. Merge it with a merge
commit (the only method enabled), so the tag stays in `fork`'s history. Conflicts, usually in
the core-details line, are resolved in the PR; keep `is_server_key_validated: true,`. A
closed PR isn't reopened; a later release gets its own.

The sync needs the `FORK_SYNC_TOKEN` secret: a fine-grained PAT for this repo only, with
Contents, Pull requests and Workflows set to read and write.

## Image builds

`fork-image.yml` runs on PRs into `fork` and on pushes to it. It takes the newest upstream
release merged into the tree, builds, starts the image against a scratch Postgres, and checks
`coreDetails` reports that tag and `isServerKeyValidated: true`. PR runs stop there. Pushes
then publish `vX.Y.Z`, `vX.Y` and `vX`, unless `vX.Y.Z` is already published (rerun with
`gh workflow run fork-image.yml -R Davie3/ryot -f force=true` to replace it). There is no
`latest` tag, so a new major is opt-in.

The check also fails when the tree has a workflow file not listed in `KNOWN_WORKFLOWS`: a
new upstream workflow would run enabled after a merge. Disable it with
`gh workflow disable`, then add it to the list.
