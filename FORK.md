# Davie3/ryot fork

Upstream [IgnisDa/ryot](https://github.com/IgnisDa/ryot) with a small core-details change
and a ProtonDB badge on game pages, published as `ghcr.io/davie3/ryot` (amd64 only).

## Branch

`fork` is the default and only branch: upstream releases merged in, plus the fork's commits:

1. `core_details` in `crates/utils/dependent/core/src/lib.rs` sets
   `is_server_key_validated: true`. The backend and frontend read that flag, so nothing
   else changes.
2. the ProtonDB badge (below).
3. this file, `mise.toml` and the two `fork-*.yml` workflows.

### ProtonDB badge

Game pages show the game's [ProtonDB](https://www.protondb.com) tier, linked to its ProtonDB
page. IGDB gives the Steam app id, which is stored in `externalIdentifiers.steamAppId`; the
browser asks a frontend route for the tier, because ProtonDB's API only allows its own origin.
Games added before the badge get the id on their next metadata update.

Fork-only files, which a sync never conflicts with:

- `crates/providers/igdb/src/steam.rs`: picks the Steam app id out of IGDB's `external_games`.
- `apps/frontend/app/routes/api.protondb.$appId.tsx`: fetches ProtonDB's summary server-side
  (cached for an hour; no reports, or any error, returns `null`).
- `apps/frontend/app/components/routes/media-item/displays/protondb-badge.tsx`: the badge.
  It sends its own GraphQL query as a string, so the generated files in `libs/generated`
  are untouched.

Lines added to upstream files, the only places a sync can conflict:

| File                                                         | Added                                               |
| ------------------------------------------------------------ | --------------------------------------------------- |
| `crates/models/media/src/metadata_models.rs`                 | `steam_app_id` in `MetadataExternalIdentifiers`     |
| `crates/providers/tvdb/src/shows.rs`                         | `..Default::default()` after `tvdb_id`              |
| `crates/providers/igdb/src/lib.rs`                           | `mod steam;`, two `external_games.*` lines in `GAME_FIELDS`, the `external_games` field on `IgdbItemResponse`, `external_identifiers` in `igdb_response_to_search_response` |
| `apps/frontend/app/routes/_dashboard.media.item.$id._index.tsx` | the import and `<ProtonDbBadge metadata={metadataDetails.data} />` after the collections group |
| `Dockerfile`                                                 | `NODE_BASE_IMAGE` bumped to `node:24.22.3-bookworm-slim` (Node.js November 2026 security release), ahead of upstream |

When resolving a conflict, keep upstream's side and add the fork's line back. If upstream
moves or renames the code a line hooks into, put the line in the equivalent place. If upstream
adds its own Steam id to `MetadataExternalIdentifiers`, drop `steam_app_id`, point `steam.rs`
and the badge's query at upstream's field, and drop the `..Default::default()` in TVDB if
nothing else needs it. Once upstream's `NODE_BASE_IMAGE` is at least the fork's, take
upstream's line and drop the `Dockerfile` row.

There is no `main`: upstream is read from the `upstream` remote, and the `Lock main` ruleset
stops a `main` branch being created here. Upstream's own workflows are disabled in this
repo's Actions settings.

## Upstream releases

`fork-sync.yml` runs daily. When upstream has a `vX.Y.Z` tag that `fork` doesn't contain, it
pushes that tag as branch `sync/vX.Y.Z` and opens a PR into `fork`. Merge it with a merge
commit (the only method enabled), so the tag stays in `fork`'s history. Conflicts, usually in
the core-details line or the badge's lines, are resolved in the PR; keep
`is_server_key_validated: true,` and see [ProtonDB badge](#protondb-badge). A closed PR isn't
reopened; a later release gets its own.

The PR runs `Fork image` on its merge into `fork`: it builds and smoke-tests the release
with the fork's changes, without publishing. The Actions token opened the PR, so GitHub holds
that run until someone with write access selects **Approve workflows to run** on the PR;
runs from your own pushes to `sync/vX.Y.Z` start straight away. GitHub doesn't run PR
workflows while the PR conflicts, so a conflicting PR shows no checks until the fix is pushed.

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

`fork-image.yml` runs on every push to `fork`, merged sync PRs included, and on PRs into
`fork`, which build and test but never publish. It takes the newest upstream release merged into the tree, typechecks the frontend,
builds, and starts the image against a scratch Postgres. It checks that `coreDetails` reports
that tag and `isServerKeyValidated: true`, that the schema has `steamAppId`, and that
`/api/protondb/<id>` is served, and only then publishes `vX.Y.Z`, `vX.Y` and `vX`. A failure
publishes nothing, so the running image stays as it was. A push whose `vX.Y.Z` is already
published skips the build (rerun with
`gh workflow run fork-image.yml -R Davie3/ryot -f force=true` to replace it; `-f publish=false`
builds and tests without pushing). There is no `latest` tag, so a new major is opt-in.

Actions are locked down in the repo settings (Settings → Actions → General): only the ten
actions the two workflows use are allowed, and every `uses:` must be pinned to a full commit
SHA. Bumping an action only changes its SHA in the workflow; adding one also means adding it
to the allowlist. The default `GITHUB_TOKEN` is read-only; each job asks for what it needs.

The build also stops when the tree has a workflow file not listed in `KNOWN_WORKFLOWS`: a new
upstream workflow arrives enabled with a sync merge. Disable it with `gh workflow disable`,
add it to the list, and push.
