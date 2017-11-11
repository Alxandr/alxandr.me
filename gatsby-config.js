module.exports = {
  siteMetadata: {
    author: 'Aleksander Heintz',
    title: 'Expected Exceptions',
    subtitle: 'Code, Software, and things that interest me',
    siteUrl: 'https://alxandr.me',
  },
  plugins: [
    'gatsby-plugin-react-next',
    'gatsby-plugin-catch-links',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-stylus',
    'gatsby-plugin-nprogress',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/src/pages`,
        name: 'pages',
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/src/posts`,
        name: 'posts',
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
    {
      resolve: '@alxandr/gatsby-transformer-blog-post',
      options: {
        commentsApiGateway: 'https://dk4b2neta5zlb.cloudfront.net',
        githubOwner: 'Alxandr',
        githubRepo: 'alxandr.me',
      },
    },
    // {
    //   resolve: '@alxandr/gatsby-plugin-google-analytics',
    //   options: {
    //     trackingId: 'UA-52360537-1',
    //   },
    // },
  ],
};
