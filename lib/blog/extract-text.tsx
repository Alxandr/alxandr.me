import { Plugin, Transformer } from 'unified';

import visit from 'unist-util-visit';

const extractText: Plugin = () => {
  const transformer: Transformer = (tree, file) => {
    const textNodes: string[] = [];
    // TODO: Ignore code probably
    visit(tree, 'text', (textNode) => textNodes.push(String(textNode.value)));
    (file.data as any).text = textNodes.join(' ');
  };

  return transformer;
};

export default extractText;
