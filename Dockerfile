# Build container for Docusaurus documentation.
#
# Mirrors the layout of axonivy/build-container read-the-docs/2: the toolchain
# lives in the image, consumer repositories provide only content and mount it
# through BASEDIR.
#
# Debian (not alpine) on purpose: the Docusaurus "faster" toolchain pulls native
# addons (@swc/core, @rspack/binding, lightningcss). Both -gnu and -musl variants
# resolve, but glibc is the predictable default for native Node addons.
FROM node:22-bookworm-slim

# make  - entrypoint, same convention as the read-the-docs container
# rsync - overlays the repository's site onto the image defaults
# git   - docusaurus reads git history for "last updated" metadata
RUN apt-get update && \
    apt-get install --yes --no-install-recommends \
      make \
      rsync \
      git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /doc-build

# Pinned Docusaurus toolchain. Kept in sync with the consumer site's
# package-lock.json; a dependency bot in this image's own repository is meant
# to bump it here so every consumer moves together.
#
# Do NOT add --omit=dev: docusaurus.config.ts is a TypeScript file and Docusaurus
# needs the `typescript` devDependency to load it.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Site scaffold: config, theme and the marketing homepage. Docs *content* is
# never baked in - it is bind-mounted at container run time and referenced by
# absolute path via DOCUSAURUS_CONTENT_DIR (see docusaurus.config.ts and the
# Makefile), so it never lives inside this directory tree. That keeps the docs
# plugin's recursive markdown scan scoped to real content and away from
# node_modules.
COPY Makefile tsconfig.json docusaurus.config.ts sidebars.ts ./
COPY src/ ./src/
COPY static/ ./static/

# Consumers run with `-u $(id -u)`, which overrides the uid but leaves the gid
# at 0. Group-writable + group 0 therefore lets any uid stage and build here.
RUN chown -R 1000:0 /doc-build && chmod -R g=u /doc-build

USER 1000:0

CMD ["make", "help"]
