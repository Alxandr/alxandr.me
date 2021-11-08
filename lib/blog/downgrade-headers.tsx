import { Plugin, Transformer } from 'unified';

import type { Element } from 'hast';
import { Node } from 'unist';
import { convert } from 'unist-util-is';
import { visit } from 'unist-util-visit';

const isElement = convert<Element>('element');
const tagMap = {
  h1: 'h3',
  h2: 'h4',
  h3: 'h5',
  h4: 'h6',
  h5: 'strong',
  h6: 'strong',
};

const visitor = (node: Node) => {
  if (isElement(node) && node.tagName.toLocaleLowerCase() in tagMap) {
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
