const slug = require('slug');
const {
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} = require('graphql');
const GitHubApi = require('github');
const formatDate = require('date-fns/format');
const { createTag } = require('./create-tag');
const { createSeries } = require('./create-series');
const { fetchComments } = require('./create-comments');

const toArray = val => (Array.isArray(val) ? val : [val]);

const createPost = async ({
  node,
  aux,
  createNode,
  createParentChildLink,
  getNode,
  githubOwner,
  githubRepo,
  githubToken,
}) => {
  const { frontmatter } = aux;
  const postSlug = frontmatter.slug || slug(frontmatter.title);
  const postDate = frontmatter.date;
  const postPath =
    frontmatter.path || `/${formatDate(postDate, 'YYYY/MM/DD')}/${postSlug}/`;
  const postTitle = frontmatter.title;
  const postTags = toArray(frontmatter.tags || []);
  const postId = `BlogPost < ${postPath}`;

  const postNode = {
    id: postId,
    children: [],
    parent: node.id,
    internal: {
      content: node.internal.content,
      contentDigest: node.internal.contentDigest,
      type: 'BlogPost',
    },
  };

  const tags = {};
  for (const tag of postTags) {
    tags[tag] = await Promise.resolve(
      createTag(tag, {
        node,
        aux,
        createNode,
        createParentChildLink,
        getNode,
      }),
    );
  }

  /* eslint-disable indent */
  const postSeries = frontmatter.series
    ? await Promise.resolve(
        createSeries(frontmatter.series, postId, { node, createNode, getNode }),
      )
    : null;
  /* eslint-enable indent */

  if (!frontmatter.issue) {
    // eslint-disable-next-line no-console
    console.error(`Post ${postTitle} does not have a configured issue.`);
  } else {
    const github = new GitHubApi({
      headers: {
        'user-agent': 'gatsby-transformer-blog-post',
      },
    });

    github.authenticate({
      type: 'token',
      token: githubToken,
    });

    await fetchComments({
      github,
      owner: githubOwner,
      repo: githubRepo,
      issue: frontmatter.issue,
      createNode,
      post: postId,
    });
  }

  postNode.slug = postSlug;
  postNode.path = postPath;
  postNode.date = postDate;
  postNode.title = postTitle;
  postNode.tags = postTags.map(t => tags[t]);
  postNode.series = postSeries;
  postNode.commentsUrl = `https://github.com/${githubOwner}/${githubRepo}/issues/${frontmatter.issue}`;

  createNode(postNode);
  createParentChildLink({ parent: node, child: postNode });
  return postId;
};
exports.createPost = createPost;

const extendPost = ({ getNode, cache }) => {
  const unifiedPluginInfo = getNode(
    'Plugin @alxandr/gatsby-transformer-unified',
  );
  const { makeGetAux, _content } = require(unifiedPluginInfo.resolve);
  const getAux = makeGetAux({ cache, getNode });

  const forwardToParent = field => async (postNode, opts, _2, _3) => {
    const { schema } = _3;
    const parent = await getNode(postNode.parent);
    const type = schema.getType('Unified');
    const fields = type.getFields();
    const fieldInfo = fields[field];
    return await fieldInfo.resolve(parent, opts, _2, _3);
  };

  return {
    html: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: async node => {
        const parent = getNode(node.parent);
        const aux = await getAux(parent);
        return aux[_content];
      },
    },

    comments: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(
            new GraphQLObjectType({
              name: 'BlogPostComment',
              fields: {
                author: {
                  type: new GraphQLNonNull(
                    new GraphQLObjectType({
                      name: 'CommentAuthor',
                      fields: {
                        name: { type: new GraphQLNonNull(GraphQLString) },
                        avatar: { type: GraphQLString },
                        url: { type: new GraphQLNonNull(GraphQLString) },
                      },
                    }),
                  ),
                },

                id: { type: new GraphQLNonNull(GraphQLString) },
                created: { type: new GraphQLNonNull(GraphQLString) },
                updated: { type: new GraphQLNonNull(GraphQLString) },
                link: { type: new GraphQLNonNull(GraphQLString) },
                html: { type: new GraphQLNonNull(GraphQLString) },
              },
            }),
          ),
        ),
      ),

      resolve: async node => {
        const commentsNode = getNode(`Comments < ${node.id}`);
        if (!commentsNode) {
          return [];
        }

        const comments = await Promise.all(
          commentsNode.comments.map(async commentId => {
            const comment = getNode(commentId);
            const parent = getNode(comment.parent);
            const aux = await getAux(parent);

            return {
              author: {
                name: comment.user.name,
                avatar: comment.user.avatar,
                url: comment.user.url,
              },

              id: comment.key,
              created: comment.created,
              updated: comment.updated,
              link: comment.link,
              html: aux[_content],
            };
          }),
        );

        return comments;
      },
    },

    commentCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: async node => {
        const commentsNode = getNode(`Comments < ${node.id}`);
        if (!commentsNode) {
          return 0;
        }

        return commentsNode.comments.length;
      },
    },

    excerpt: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        pruneLength: {
          type: GraphQLInt,
          defaultValue: 140,
        },
      },
      resolve: forwardToParent('excerpt'),
    },

    tags: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(
            new GraphQLObjectType({
              name: 'TagInfo',
              fields: {
                name: { type: new GraphQLNonNull(GraphQLString) },
                path: { type: new GraphQLNonNull(GraphQLString) },
              },
            }),
          ),
        ),
      ),

      resolve: node => {
        return node.tags.map(tagId => {
          const tagNode = getNode(tagId);
          return { name: tagNode.name, path: tagNode.path };
        });
      },
    },

    series: {
      type: new GraphQLObjectType({
        name: 'SeriesInfo',
        fields: {
          name: { type: new GraphQLNonNull(GraphQLString) },
          path: { type: new GraphQLNonNull(GraphQLString) },
          posts: {
            type: new GraphQLNonNull(
              new GraphQLList(
                new GraphQLNonNull(
                  new GraphQLObjectType({
                    name: 'SeriesPostInfo',
                    fields: {
                      title: { type: new GraphQLNonNull(GraphQLString) },
                      path: { type: new GraphQLNonNull(GraphQLString) },
                    },
                  }),
                ),
              ),
            ),
          },
        },
      }),

      resolve: node => {
        const seriesId = node.series;
        if (!seriesId) return null;

        const series = getNode(seriesId);
        const posts = series.posts.map(postId => {
          const post = getNode(postId);
          return {
            title: post.title,
            path: post.path,
          };
        });

        return {
          name: series.name,
          path: series.path,
          posts,
        };
      },
    },

    date: { type: new GraphQLNonNull(GraphQLString) },
  };
};
exports.extendPost = extendPost;
