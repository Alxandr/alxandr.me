import { Node, Parent } from 'unist';
import h, { HTMLNode } from 'hastscript';

import { Plugin } from 'unified';
import _ from 'lodash';
import classNames from 'classnames';
import convert from 'unist-util-is/convert';
import nodeToString from 'hast-util-to-string';
import { tokenize } from '@yolodev/highlight';

const lines = (content: string): Iterable<string> => {
  return content.split('\n').map((l) => l.trimEnd());
};

const classesFromScope = (scope: string): string => {
  const classes = [];
  const parts = scope.split('.');
  let acc = parts.shift()!;
  classes.push(acc);
  for (const part of parts) {
    acc += '-' + part;
    classes.push(acc);
  }

  return classNames(classes);
};

const classesFromScopes = (scopes: readonly string[], langScopeName: string): string => {
  const classes = [];
  for (const scope of scopes) {
    if (scope === langScopeName) continue;

    const parts = scope.split('.');
    let acc = parts.shift()!;
    classes.push(acc);
    for (const part of parts) {
      acc += '-' + part;
      classes.push(acc);
    }
  }

  return classNames(...classes);
};

const highlightCode = async (content: string, lang: string): Promise<readonly Node[] | null> => {
  const tokenStream = await tokenize(content, lang);
  if (!tokenStream) {
    console.warn(`Language ${lang} not found.`);
    return null;
  }

  const nodes: Node[] = [];
  let stack: Node[][] = [];
  let current: Node[] = nodes;
  for (const e of tokenStream) {
    switch (e.type) {
      case 'start': {
        const node = h('span', { class: classesFromScope(e.scope) });
        current.push(node);
        stack.push(current);
        current = node.children;
        break;
      }

      case 'token': {
        const node = { type: 'text', value: e.text };
        current.push(node);
        break;
      }

      case 'line': {
        const node = { type: 'text', value: '\n' };
        current.push(node);
        break;
      }

      case 'end': {
        if (stack.length === 0) throw new Error('stack inbalance (end with no start)');
        current = stack.pop()!;
        break;
      }
    }
  }

  if (stack.length > 0) throw new Error('stack inbalance (missing end)');
  return nodes;
};

const getLanguage = (node: Node) => {
  const className = (node.properties as any).className || [];

  for (const classListItem of className) {
    if (classListItem.slice(0, 9) === 'language-') {
      return classListItem.slice(9).toLowerCase();
    }
  }

  return null;
};

const visitor = async (node: Node, parents: readonly Parent[]) => {
  const parent = parents[parents.length - 1];
  if (!parent || parent.tagName !== 'pre' || node.tagName !== 'code') {
    return;
  }

  const lang = getLanguage(node);

  if (lang === null) {
    return;
  }

  (parent as any).properties.className = classNames((parent as any).properties.className, 'language-' + lang);
  const result = await highlightCode(nodeToString(node), lang);
  if (result) {
    node.children = result;
  }
};

const CONTINUE = true;
const SKIP = 'skip';
const EXIT = false;

type VisitResult = void | Node | readonly Node[] | number | typeof CONTINUE | typeof SKIP | typeof EXIT;

const toVisitResult = async (value: VisitResult | Promise<VisitResult>): Promise<any> => {
  const val = await Promise.resolve(value);
  if (val !== null && typeof val === 'object' && 'length' in val) {
    return val;
  }

  if (typeof val === 'number') {
    return [CONTINUE, val];
  }

  return [val];
};

const visit = async (
  tree: Node,
  test: string,
  visitor: (node: Node, parents: readonly Parent[]) => VisitResult | Promise<VisitResult>,
) => {
  const is = convert(test);

  // Visit children in `parent`.
  const all = async (children: readonly Node[], parents: readonly Parent[]): Promise<any> => {
    let min = -1;
    let step = 1;
    let index = min + step;
    let result;

    while (index > min && index < children.length) {
      result = await one(children[index], index, parents);

      if (result[0] === EXIT) {
        return result;
      }

      index = typeof result[1] === 'number' ? result[1] : index + step;
    }
  };

  // Visit a single node.
  const one = async (node: Node, index: number | undefined, parents: readonly Parent[]): Promise<any> => {
    let result = [];
    let subresult;

    if (!test || is(node, index, parents[parents.length - 1] || null)) {
      result = await toVisitResult(visitor(node, parents));

      if (result[0] === EXIT) {
        return result;
      }
    }

    if (node.children && result[0] !== SKIP) {
      subresult = await toVisitResult(all(node.children as Node[], parents.concat(node as Parent)));
      return subresult[0] === EXIT ? subresult : result;
    }

    return result;
  };

  await one(tree, void 0, []);
};

const highlight: Plugin = () => {
  return async (tree) => {
    await visit(tree, 'element', visitor);
  };
};

export default highlight;
