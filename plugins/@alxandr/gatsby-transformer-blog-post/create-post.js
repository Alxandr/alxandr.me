const slug = require('slug');
const {
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} = require('graphql');
const formatDate = require('date-fns/format');
const { createTag } = require('./create-tag');
const { createSeries } = require('./create-series');

const toArray = val => (Array.isArray(val) ? val : [val]);

const createPost = async ({
  node,
  aux,
  createNode,
  createParentChildLink,
  getNode,
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

  postNode.slug = postSlug;
  postNode.path = postPath;
  postNode.date = postDate;
  postNode.title = postTitle;
  postNode.tags = postTags.map(t => tags[t]);
  postNode.series = postSeries;

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
        const aux = await getAux(node);
        return aux[_content];
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

    date: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        format: {
          type: GraphQLString,
          defaultValue: 'DD MMM YYYY',
        },
      },
      resolve: (node, { format }) => {
        if (format === 'ISO') return formatDate(node.date);
        return formatDate(node.date, format);
      },
    },
  };
};
exports.extendPost = extendPost;
