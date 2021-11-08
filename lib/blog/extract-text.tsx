import { Plugin, Transformer } from 'unified';

import { Text } from 'mdast';
import { convert } from 'unist-util-is';
import { visit } from 'unist-util-visit';

const isText = convert<Text>('text');

const extractText: Plugin = () => {
  const transformer: Transformer = (tree, file) => {
    const textNodes: string[] = [];
    // TODO: Ignore code probably
    visit(tree, isText, (textNode: Text) => textNodes.push(String(textNode.value)));
    (file.data as any).text = textNodes.join(' ');
  };

  return transformer;
};

export default extractText;
