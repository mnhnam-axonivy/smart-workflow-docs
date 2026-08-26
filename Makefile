# Makefile for building Docusaurus documentation inside the build container.
#
# The repository is mounted at BASEDIR and the content directory is SITE,
# relative to BASEDIR. Docusaurus itself - config, theme, node_modules - lives
# in this image (WORKDIR) and is never mixed with the mounted content: the
# content directory is referenced by absolute path via DOCUSAURUS_CONTENT_DIR,
# which docusaurus.config.ts reads at config-load time. Nothing is copied or
# symlinked into WORKDIR, so the docs plugin's recursive markdown scan can
# never wander into node_modules or src/.

SHELL := /bin/bash

# BASEDIR must be absolute - it is the mount point of the repository.
BASEDIR ?= /doc
SITE    ?= doc/user
LOCALE  ?=

SITEDIR := $(BASEDIR)/$(SITE)
OUTDIR  ?= $(SITEDIR)/build
WORKDIR := /doc-build

export DOCUSAURUS_CONTENT_DIR := $(SITEDIR)

DOCUSAURUS := node $(WORKDIR)/node_modules/.bin/docusaurus
TSC        := node $(WORKDIR)/node_modules/.bin/tsc

LOCALE_ARG := $(if $(LOCALE),--locale $(LOCALE),)

.PHONY: help build start serve typecheck clean check-site

help:
	@echo "Docusaurus build container"
	@echo ""
	@echo "Targets:"
	@echo "  build       build the static site into OUTDIR"
	@echo "  start       development server with hot reload on port 3000"
	@echo "  serve       serve an already built site on port 3000"
	@echo "  typecheck   run tsc against the scaffold (config, theme)"
	@echo "  clean       remove build output and caches"
	@echo ""
	@echo "Variables (make arguments, e.g. 'make build SITE=doc/user'):"
	@echo "  BASEDIR   absolute mount point of the repository  (current: $(BASEDIR))"
	@echo "  SITE      content directory relative to BASEDIR   (current: $(SITE))"
	@echo "  OUTDIR    build output directory                  (current: $(OUTDIR))"
	@echo "  LOCALE    build a single locale only              (current: $(LOCALE))"
	@echo ""
	@echo "Site identity (docker run -e flags, not make arguments - read by"
	@echo "docusaurus.config.ts, defaults are this repository's own site):"
	@echo "  SITE_TITLE, SITE_URL, SITE_BASE_URL, SITE_EDIT_URL,"
	@echo "  GITHUB_ORG, GITHUB_REPO, GITHUB_URL"
	@echo ""
	@echo "Example:"
	@echo "  docker run -v .:/doc -u \$$(id -u) mnhnam/docusaurus:3 \\"
	@echo "    make build BASEDIR=/doc SITE=doc/user"
	@echo ""
	@echo "Example, overriding site identity for a different consumer:"
	@echo "  docker run -v .:/doc -u \$$(id -u) \\"
	@echo "    -e SITE_TITLE=\"Other Project\" -e GITHUB_REPO=other-project \\"
	@echo "    mnhnam/docusaurus:3 make build BASEDIR=/doc SITE=doc/user"

check-site:
	@test -d "$(SITEDIR)" || { \
		echo "error: content directory '$(SITEDIR)' not found."; \
		echo "       pass BASEDIR (absolute mount point) and SITE (relative content dir)."; \
		exit 1; \
	}

# Production build. Docusaurus writes to its default output directory inside
# WORKDIR; the result is then mirrored into the mounted repository, so no
# absolute --out-dir path handling is involved.
build: check-site
	cd "$(WORKDIR)" && $(DOCUSAURUS) build $(LOCALE_ARG)
	mkdir -p "$(OUTDIR)"
	rsync -a --delete "$(WORKDIR)/build/" "$(OUTDIR)/"
	@echo "built site available at $(OUTDIR)"

typecheck:
	cd "$(WORKDIR)" && $(TSC) --noEmit

# Development server. Runs from WORKDIR (where docusaurus.config.ts lives);
# content is read live from the mounted SITEDIR via DOCUSAURUS_CONTENT_DIR, so
# edits under the mount are picked up without a rebuild step.
start: check-site
	cd "$(WORKDIR)" && $(DOCUSAURUS) start --host 0.0.0.0 --port 3000 --no-open $(LOCALE_ARG)

serve:
	@test -d "$(OUTDIR)" || { echo "error: '$(OUTDIR)' not found, run 'make build' first."; exit 1; }
	cd "$(WORKDIR)" && $(DOCUSAURUS) serve --dir "$(OUTDIR)" --host 0.0.0.0 --port 3000 --no-open

# Everything transient lives under WORKDIR (this image's ephemeral
# filesystem); the only thing ever written into the mounted repository is
# OUTDIR, so that is the only mounted path clean removes.
clean:
	rm -rf "$(OUTDIR)" "$(WORKDIR)/build" "$(WORKDIR)/.docusaurus"
