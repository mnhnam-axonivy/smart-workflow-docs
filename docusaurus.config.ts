import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// The consumer repository's content directory. The Makefile sets this to the
// mounted BASEDIR/SITE. The fallback resolves to ../doc/user, which only
// exists when this config is exercised directly against a checkout of the
// smart-workflow repository (this folder sits at its root, next to doc/) -
// once extracted to its own repository that sibling won't exist, so the env
// var becomes required and a missing content dir fails with a clear error.
const CONTENT_DIR = process.env.DOCUSAURUS_CONTENT_DIR ?? '../doc/user';

const config: Config = {
  title: 'Smart Workflow',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: 'https://axonivy-market.github.io',
  baseUrl: '/smart-workflow/',

  // GitHub pages deployment config.
  organizationName: 'axonivy-market',
  projectName: 'smart-workflow',

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
          editUrl:
            'https://github.com/axonivy-market/smart-workflow/tree/master/doc/user/',
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
      title: 'Smart Workflow',
      logo: {
        alt: 'Smart Workflow Logo',
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
          href: 'https://github.com/axonivy-market/smart-workflow',
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
              href: 'https://github.com/axonivy-market/smart-workflow',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Smart Workflow. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
