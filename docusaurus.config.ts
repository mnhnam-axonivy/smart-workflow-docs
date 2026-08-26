import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// Everything below is overridable via `docker run -e ...` so a second
// consumer repository can reuse this image without a rebuild. Each default
// is this repository's own (smart-workflow) value, so a build with no env
// vars set at all still produces exactly today's site.

// The consumer repository's content directory. The Makefile sets this to the
// mounted BASEDIR/SITE. The fallback resolves to ../doc/user, which only
// exists when this config is exercised directly against a checkout of the
// smart-workflow repository (this folder sits at its root, next to doc/) -
// once extracted to its own repository that sibling won't exist, so the env
// var becomes required and a missing content dir fails with a clear error.
const CONTENT_DIR = process.env.DOCUSAURUS_CONTENT_DIR ?? '../doc/user';

const SITE_TITLE = process.env.SITE_TITLE ?? 'Smart Workflow';
const SITE_URL = process.env.SITE_URL ?? 'https://axonivy-market.github.io';
const SITE_BASE_URL = process.env.SITE_BASE_URL ?? '/smart-workflow/';

// GITHUB_ORG/GITHUB_REPO drive organizationName/projectName (GitHub Pages
// metadata) and, unless overridden directly, the derived GitHub links below.
const GITHUB_ORG = process.env.GITHUB_ORG ?? 'axonivy-market';
const GITHUB_REPO = process.env.GITHUB_REPO ?? 'smart-workflow';
const GITHUB_URL =
  process.env.GITHUB_URL ?? `https://github.com/${GITHUB_ORG}/${GITHUB_REPO}`;
// Assumes content lives at doc/user on the default branch, matching this
// repository's own layout - override directly if a consumer's branch name or
// content path differs.
const SITE_EDIT_URL =
  process.env.SITE_EDIT_URL ?? `${GITHUB_URL}/tree/master/doc/user/`;

const config: Config = {
  title: SITE_TITLE,
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: SITE_URL,
  baseUrl: SITE_BASE_URL,

  // GitHub pages deployment config.
  organizationName: GITHUB_ORG,
  projectName: GITHUB_REPO,

  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
      onBrokenMarkdownImages: 'warn',
    },
  },

  plugins: [
    [
      '@cmfcmf/docusaurus-search-local',
      {
        indexDocs: true,
        indexBlog: false,
        indexPages: true,
        language: 'en',
      },
    ],
  ],

  // Single locale for now - Phase 5 (doc/i18n) re-adds 'de' once translated
  // content actually exists. An active locale with zero content is worse
  // than no locale.
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: CONTENT_DIR,
          sidebarPath: './sidebars.ts',
          editUrl: SITE_EDIT_URL,
          versions: {
            current: {
              label: '14.0.0-beta6',
            },
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/axon-ivy-social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: SITE_TITLE,
      logo: {
        alt: `${SITE_TITLE} Logo`,
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: GITHUB_URL,
          label: 'GitHub',
          position: 'right',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
        },
        {
          type: 'search',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: GITHUB_URL,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ${SITE_TITLE}. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
