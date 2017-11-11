const path = require('path');

const PER_PAGE = 10;

const rootQuery = `
query BlogPosts {
  allBlogPost {
    edges {
      node {
        path
      }
    }
  }
  allTag {
    edges {
      node {
        path
        id
      }
    }
  }
}
`;

const countAllQuery = `
query AllBlogPosts {
  allBlogPost {
    totalCount
  }
}
`;

const countTagQuery = `
query TagBlogPosts($tag: String!) {
  allBlogPost(filter: { tagIds: { in: [$tag] } }) {
    totalCount
  }
}
`;

const paginate = async ({
  type,
  graphql,
  query,
  context = {},
  createPage,
  basePath,
  force = false,
}) => {
  try {
    const blogListTemplate = path.resolve(`src/templates/blog/${type}.js`);
    const result = await graphql(query, context);

    if (result.errors) {
      throw result.errors;
    }

    const count = result.data.allBlogPost.totalCount;
    if (count == 0 && !force) {
      return;
    }

    const getPath = page =>
      page == 1 ? basePath : `${basePath}pages/${page}/`;

    const pageCount = Math.max(1, Math.ceil(count / PER_PAGE));
    for (let i = 0; i < pageCount; i++) {
      const page = i + 1;
      const path = getPath(page);
      createPage({
        path: path,
        component: blogListTemplate,
        context: Object.assign(
          {
            page,
            limit: PER_PAGE,
            skip: PER_PAGE * i,
            prev:
              page == 1
                ? null
                : { path: getPath(page - 1), name: `Page ${page - 1}` },
            next:
              page == pageCount
                ? null
                : { path: getPath(page + 1), name: `Page ${page + 1}` },
          },
          context,
        ),
      });
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

exports.createPages = async ({ boundActionCreators, graphql }) => {
  try {
    const { createPage } = boundActionCreators;

    const blogPostTemplate = path.resolve('src/templates/blog/post.js');
    const result = await graphql(rootQuery);

    if (result.errors) {
      throw result.errors;
    }

    const posts = result.data.allBlogPost.edges;
    for (const { node } of posts) {
      createPage({
        path: node.path,
        component: blogPostTemplate,
        context: {},
      });
    }

    await paginate({
      type: 'list',
      graphql,
      query: countAllQuery,
      createPage,
      basePath: '/',
      force: true,
    });

    const tags = result.data.allTag.edges;
    for (const { node } of tags) {
      await paginate({
        type: 'tag',
        graphql,
        query: countTagQuery,
        createPage,
        basePath: node.path,
        context: {
          tag: node.id,
        },
      });
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};
