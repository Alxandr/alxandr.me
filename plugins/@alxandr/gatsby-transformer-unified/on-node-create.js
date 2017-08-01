const crypto = require('crypto');

const onCreateNode = async (
  { node, boundActionCreators, loadNodeContent },
  pluginOptions,
) => {
  const { createNode, createParentChildLink } = boundActionCreators;

  // We only care about markdown content.
  if (node.internal.mediaType !== 'text/x-markdown') {
    return;
  }

  const pluginsCacheKey = pluginOptions.plugins.map(p => p.name).join('|');
  const content = await loadNodeContent(node);
  const contentDigest = crypto.createHash('md5').update(content).digest('hex');

  const unifiedNode = {
    id: `Unified < ${node.id}`,
    children: [],
    parent: node.id,
    cacheKey: `unified-${contentDigest}|${pluginsCacheKey}`,
    internal: {
      type: 'Unified',
      content,
      contentDigest,
    },
  };

  // Add path to the markdown file path
  if (node.internal.type === 'File') {
    unifiedNode.absolutePath = node.absolutePath;
  }

  createNode(unifiedNode);
  createParentChildLink({ parent: node, child: unifiedNode });
};

module.exports = onCreateNode;
