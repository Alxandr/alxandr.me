module.exports = {
  siteMetadata: {
    author: 'Aleksander Heintz',
    title: 'Expected Exceptions',
    subtitle: 'Code, Software, and things that interest me',
    siteUrl: 'https://alxandr.me',
  },
  plugins: [
    'gatsby-plugin-catch-links',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-nprogress',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/src`,
      },
    },
    {
      resolve: '@alxandr/gatsby-transformer-unified',
      options: {
        plugins: [
          'remark-parse',
          'remark-frontmatter',
          '@alxandr/gatsby-unified-frontmatter',
          '@alxandr/gatsby-unified-excerpt',
          'remark-rehype',
          'rehype-highlight',
          'rehype-stringify',
        ],
      },
    },
    'gatsby-plugin-sitemap',
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'Alxandr.me',
        icons: [
          {
            src: '/android-chrome-192x192.png?v=rMlMBWn9rX',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png?v=rMlMBWn9rX',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        theme_color: '#ffffff',
        background_color: '#ffffff',
        start_url: 'https://alxandr.me',
        display: 'standalone',
        orientation: 'portrait',
      },
    },
    'gatsby-plugin-offline',
    {
      resolve: '@alxandr/gatsby-plugin-google-analytics',
      options: {
        trackingId: 'UA-52360537-1',
      },
    },
    {
      resolve: '@alxandr/gatsby-transformer-blog-post',
      options: {
        githubToken: process.env.GITHUB_TOKEN,
        githubOwner: 'Alxandr',
        githubRepo: 'alxandr.me',
      },
    },
    {
      resolve: '@alxandr/gatsby-plugin-feed',
    },
  ],
};
