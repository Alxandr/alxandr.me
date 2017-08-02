const slug = require('slug');
const { createPost, extendPost } = require('./create-post');
const { createTag } = require('./create-tag');
const { createComment } = require('./create-comments');

slug.defaults.modes.pretty.lower = true;

exports.onCreateNode = async (
  { node, boundActionCreators, getNode, cache },
  { githubToken, githubRepo, githubOwner },
) => {
  const {
    createNode,
    createParentChildLink,
    createNodeField,
  } = boundActionCreators;
  if (node.internal.type !== 'Unified') {
    return null;
  }

  const unifiedPluginInfo = getNode(
    'Plugin @alxandr/gatsby-transformer-unified',
  );
  const { makeGetAux } = require(unifiedPluginInfo.resolve);
  const getAux = makeGetAux({ cache, getNode });
  const aux = await getAux(node);

  if (!aux) {
    return null;
  }

  const { frontmatter } = aux;
  switch (frontmatter.type) {
    case 'post':
      return await Promise.resolve(
        createPost({
          node,
          aux,
          createNode,
          createParentChildLink,
          createNodeField,
          getNode,
          githubOwner,
          githubRepo,
          githubToken,
        }),
      );

    case 'tag':
      if (!frontmatter.tag) {
        throw new Error(
          `Tag page does not have tag set in frontmatter. Path: ${node.absolutePath}`,
        );
      }

      return await Promise.resolve(
        createTag(frontmatter.tag, {
          node,
          aux,
          createNode,
          createParentChildLink,
          createNodeField,
          getNode,
        }),
      );

    case 'comment':
      if (!frontmatter.post) {
        throw new Error('Comment does not have post set in frontmatter.');
      }

      return await Promise.resolve(
        createComment({
          node,
          aux,
          createNode,
          createParentChildLink,
          getNode,
        }),
      );

    default:
      return null;
  }
};

exports.setFieldsOnGraphQLNodeType = async ({ type, getNode, cache }) => {
  switch (type.name) {
    case 'BlogPost':
      return await Promise.resolve(
        extendPost({
          type,
          getNode,
          cache,
        }),
      );

    default:
      return null;
  }
};
