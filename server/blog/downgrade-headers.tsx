import { Plugin, Transformer } from 'unified';

import { Node } from 'unist';
import is from 'hast-util-is-element';
import visit from 'unist-util-visit';

const tagMap = {
  h1: 'h3',
  h2: 'h4',
  h3: 'h5',
  h4: 'h6',
  h5: 'strong',
  h6: 'strong',
};

const tagNames = Object.keys(tagMap);

const visitor = (node: Node) => {
  if (is(node, tagNames)) {
    //node.type = tagMap[node.type as keyof typeof tagMap];
    node.tagName = tagMap[node.tagName as keyof typeof tagMap];
  }
};

const transformer: Transformer = (tree) => {
  visit(tree, 'element', visitor);
};

const downgradeHeaders: Plugin = () => {
  return transformer;
};

export default downgradeHeaders;
