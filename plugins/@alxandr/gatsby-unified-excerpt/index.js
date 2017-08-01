const visit = require('unist-util-visit');
const prune = require('underscore.string/prune');
const { GraphQLString, GraphQLNonNull, GraphQLInt } = require('graphql');

module.exports = function excerptAttacher() {
  const { gatsby } = this;

  gatsby.ext.excerpt = {
    type: new GraphQLNonNull(GraphQLString),
    args: {
      pruneLength: {
        type: GraphQLInt,
        defaultValue: 140,
      },
    },
    resolve: async (node, { pruneLength = 140 }) => {
      const aux = await gatsby.getAux(node);
      return prune(aux.text, pruneLength);
    },
  };

  return function extractExcerpt(tree) {
    const textNodes = [];
    visit(tree, 'text', textNode => textNodes.push(textNode.value));
    gatsby.aux.text = textNodes.join(' ');
  };
};
