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

The sync uses the Actions token, with "Allow GitHub Actions to create and approve pull
requests" enabled. That token can't push commits that change `.github/workflows/`, so a
release that touches upstream's workflows fails the run. Push the branch from a clone, then
run the sync again to open the PR:

```sh
git fetch upstream --tags
git push origin 'vX.Y.Z^{commit}:refs/heads/sync/vX.Y.Z'
gh workflow run fork-sync.yml -R Davie3/ryot
```

## Image builds

`fork-image.yml` runs on every push to `fork`, merged sync PRs included; PRs themselves don't
build. It takes the newest upstream release merged into the tree, builds, starts the image
against a scratch Postgres, checks `coreDetails` reports that tag and
`isServerKeyValidated: true`, and only then publishes `vX.Y.Z`, `vX.Y` and `vX`. A push whose
`vX.Y.Z` is already published skips the build (rerun with
`gh workflow run fork-image.yml -R Davie3/ryot -f force=true` to replace it). There is no
`latest` tag, so a new major is opt-in.

Actions are locked down in the repo settings (Settings → Actions → General): only the ten
actions the two workflows use are allowed, and every `uses:` must be pinned to a full commit
SHA. Bumping an action only changes its SHA in the workflow; adding one also means adding it
to the allowlist. The default `GITHUB_TOKEN` is read-only; each job asks for what it needs.

The build also stops when the tree has a workflow file not listed in `KNOWN_WORKFLOWS`: a new
upstream workflow arrives enabled with a sync merge. Disable it with `gh workflow disable`,
add it to the list, and push.
