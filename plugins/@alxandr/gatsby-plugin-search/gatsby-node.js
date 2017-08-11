const crypto = require('crypto');
const { GraphQLScalarType } = require('graphql');
const elasticlunr = require('elasticlunr');

const SEARCH_INDEX_ID = 'SearchIndex < Blog';
const SEARCH_INDEX_TYPE = 'BlogSearchIndex';

const md5 = src => crypto.createHash('md5').update(src).digest('hex');

const createEmptySearchIndexNode = () => ({
  id: SEARCH_INDEX_ID,
  parent: '___SOURCE___',
  children: [],
  posts: [],
});

const appendPost = ({ posts }, newPost) => {
  const newPosts = [...posts, newPost];
  const content = JSON.stringify(newPost);
  return {
    id: SEARCH_INDEX_ID,
    parent: '___SOURCE___',
    children: [],
    posts: newPosts,
    internal: {
      type: SEARCH_INDEX_TYPE,
      content: content,
      contentDigest: md5(content),
    },
  };
};

const createOrGetIndex = async (node, cache, getNode, getAux, server) => {
  const cacheKey = `${node.id}:index`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const index = elasticlunr();
  index.addField('title');
  index.addField('body');
  index.setRef('id');

  const { schema } = server;
  const postType = schema.getType('BlogPost');
  const postFields = postType.getFields();
  const getExcerpt = postFields['excerpt'].resolve;
  const getCommentCount = postFields['commentCount'].resolve;
  const getTags = postFields['tags'].resolve;

  for (const postId of node.posts) {
    const post = getNode(postId);
    const postParent = getNode(post.parent);
    const aux = await getAux(postParent);
    const doc = {
      id: post.id,
      path: post.path,
      title: post.title,
      body: aux.text,
      date: post.date,
      excerpt: await getExcerpt(post, { pruneLength: 140 }, void 0, server),
      commentCount: await getCommentCount(post, {}, void 0, server),
      tags: await getTags(post, {}, void 0, server),
    };

    index.addDoc(doc);
  }

  const json = index.toJSON();
  await cache.set(cacheKey, json);
  return json;
};

const SearchIndex = new GraphQLScalarType({
  name: `${SEARCH_INDEX_TYPE}_Index`,
  description: 'Serialized elasticlunr search index',
  parseValue() {
    throw new Error('Not supported');
  },
  serialize(value) {
    return value;
  },
  parseLiteral() {
    throw new Error('Not supported');
  },
});

exports.onCreateNode = ({ node, boundActionCreators, getNode }) => {
  const { createNode } = boundActionCreators;
  if (node.internal.type !== 'BlogPost') {
    return null;
  }

  const searchIndex = getNode(SEARCH_INDEX_ID) || createEmptySearchIndexNode();
  const newSearchIndex = appendPost(searchIndex, node.id);
  createNode(newSearchIndex);
};

exports.setFieldsOnGraphQLNodeType = ({ type, getNode, cache }) => {
  if (type.name !== SEARCH_INDEX_TYPE) {
    return null;
  }

  const unifiedPluginInfo = getNode(
    'Plugin @alxandr/gatsby-transformer-unified',
  );
  const { makeGetAux } = require(unifiedPluginInfo.resolve);
  const getAux = makeGetAux({ cache, getNode });

  return {
    index: {
      type: SearchIndex,
      resolve: (node, _opts, _3, server) =>
        createOrGetIndex(node, cache, getNode, getAux, server),
    },
  };
};
