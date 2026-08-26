# docusaurus build container

Builds the [Smart Workflow](https://github.com/axonivy-market/smart-workflow)
documentation site (`doc/user`) without installing a Node toolchain in that
repository or in its CI workflow. The toolchain, theme, and static assets live
in this image; the consumer repository provides only content.

Published to Docker Hub as `mnhnam/docusaurus:3` on every push to `master` (see
[`.github/workflows/publish.yml`](.github/workflows/publish.yml)). Originated
as `docker/` inside the `smart-workflow` repository and was extracted here
once the design settled — see that repository's docs-migration history for
the "why".

## what is in the image

| Provided by this image | Provided by the consumer repository |
| --- | --- |
| Node 22 runtime, pinned Docusaurus toolchain (`node_modules`) | markdown content (`doc/user`) |
| `docusaurus.config.ts`, `sidebars.ts`, `tsconfig.json` | — |
| `src/` (marketing homepage, theme CSS), `static/` (favicon, logo, social card) | — |
| `Makefile` build targets | — |

Content is never copied into the image or merged with its files. The mounted
content directory is referenced by **absolute path**, via the
`DOCUSAURUS_CONTENT_DIR` environment variable that `docusaurus.config.ts` reads
at config-load time (see the `docs.path` option in that file and the
`SITEDIR`/`export` lines in the `Makefile`). This mirrors how the original
prototype worked — `docs.path: '../doc'`, a sibling of the Docusaurus project,
never nested inside it — and matters: the docs plugin recursively scans
whatever `docs.path` points to for `.md`/`.mdx` files, so if content were
copied into the same directory as `node_modules`, that scan would also walk
thousands of npm packages' own README files.

`doc/i18n/` (translations, Phase 5) and `versioned_docs/` (release snapshots,
Phase 6) are architecturally repository-owned too, but neither is wired up
yet — this image currently builds a single locale with no version history.

## variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `BASEDIR` | `/doc` | Absolute mount point of the consumer repository inside the container |
| `SITE` | `doc/user` | Content directory, relative to `BASEDIR` |
| `OUTDIR` | `$(BASEDIR)/$(SITE)/build` | Where the built site is written |
| `LOCALE` | *(all)* | Build a single locale only |

`BASEDIR` must be absolute.

## targets

```sh
make build       # production build into OUTDIR
make start       # dev server with hot reload, port 3000
make serve       # serve an already built site, port 3000
make typecheck   # tsc --noEmit
make clean       # drop build output and caches
```

## build pipeline

```sh
docker run -v .:/doc -u $(id -u) mnhnam/docusaurus:3 \
  make build BASEDIR=/doc SITE=doc/user
```

The build runs inside the image, not in the mounted repository, so the CI
checkout stays clean. Only `OUTDIR` is written back.

In a GitHub Actions workflow this replaces `actions/setup-node` + `npm ci` +
`npm run build` with a single step:

```yaml
- uses: actions/checkout@v7

- name: Build documentation
  run: |
    docker run -v .:/doc -u $(id -u) mnhnam/docusaurus:3 \
      make build BASEDIR=/doc SITE=doc/user

- uses: actions/upload-pages-artifact@v5
  with:
    path: doc/user/build
```

Keep the artifact upload on the host runner rather than moving the whole job
into a `container:`. JS actions run inside a job container and the runner's
bundled Node needs glibc, which makes alpine-based job containers brittle.

## local validation

`.github/workflows/publish.yml` builds this image on every push and pull
request (pushing to Docker Hub only outside of PRs). To build and run it
directly against a checkout of the consumer repository:

```sh
docker build -t mnhnam/docusaurus:3 .
docker run -v /path/to/smart-workflow:/doc -u $(id -u) mnhnam/docusaurus:3 \
  make build BASEDIR=/doc SITE=doc/user
```

## preview

Use it as previewer with `docker compose` — edit the `volumes:` mount in
`compose.yaml` to point at a local checkout of the consumer repository first:

```sh
docker compose up
```

Open `http://localhost:3000/smart-workflow/` — note the `baseUrl` subpath, the
site is not served at the root.

`make start` runs Docusaurus's dev server from inside the image (where
`docusaurus.config.ts` and `node_modules` live); content is read live from the
mounted directory via `DOCUSAURUS_CONTENT_DIR`, so no copying or symlinking is
needed for edits to be picked up.

## notes

- **`baseUrl` is fixed in this image's `docusaurus.config.ts`** (currently
  `/smart-workflow/`), not something a consumer can override per build. That
  is fine while there is exactly one consumer; if a second one ever adopts
  this image, `baseUrl` would need to become an env var too, the same way
  `DOCUSAURUS_CONTENT_DIR` already is.
- **"Last updated" metadata is unavailable.** The build runs in `/doc-build`,
  detached from the mounted `.git`. Harmless unless the site enables
  `showLastUpdateTime`.
- **Keeping the toolchain in sync.** `package.json` and `package-lock.json`
  here are copied from the consumer site. Once this image has its own
  repository, a dependency bot there should bump them — one place to move
  Docusaurus for every consumer. When a consumer needs a dependency this image
  does not have, add it here rather than in the site.
