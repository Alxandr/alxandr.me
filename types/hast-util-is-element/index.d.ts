declare module 'hast-util-is-element' {
  import { Node } from 'unist';

  function is(node: Node, type: readonly string[]): boolean;

  export = is;
}
