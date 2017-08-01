exports.runQuery = (handler, query) =>
  handler(query).then(r => {
    if (r.errors) {
      throw new Error(r.errors.join(', '));
    }

    return r.data;
  });

exports.defaultOptions = {
  // Override if you want to manually specify the RSS "generator" tag.
  generator: 'GatsbyJS',

  // Run a default query to gather some information about the site.
  query: `
    {
      site {
        siteMetadata {
          title
          subtitle
          siteUrl
          author
        }
      }
    }
  `,

  transform: (
    { site: { siteMetadata: { title, subtitle, siteUrl, author } } },
    { generator, output },
  ) => ({
    title,
    subtitle,
    generator,
    authors: [author],
    link: siteUrl + '/',
    feedLink: siteUrl + output,
    id: siteUrl,
  }),

  // Create a default RSS feed. Others may be added by using the format below.
  // TODO: Filter out drafts?
  feeds: {
    '/atom.xml': {
      query: `
      {
        allBlogPost(
          limit: 1000
          sort: { order: DESC, fields: [date] }
        ) {
          edges {
            node {
              title
              date(format: "ISO")
              path
              excerpt
              html
            }
          }
        }
      }
      `,

      transform: ({ allBlogPost: { edges } }, { link }) => {
        const ret = [];
        for (const { node } of edges) {
          ret.push({
            id: link + node.path,
            title: node.title,
            updated: node.date,
            summary: node.excerpt,
            link: link + node.path,
            content: node.html,
            published: node.date,
          });
        }

        return ret;
      },
    },
  },
};
