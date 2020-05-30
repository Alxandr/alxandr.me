import { INITIAL, IOnigLib, Registry, parseRawGrammar } from 'vscode-textmate';
import { Node, Parent } from 'unist';
import { OnigScanner, OnigString, loadWASM } from 'vscode-oniguruma';
import h, { HTMLNode } from 'hastscript';

import { Plugin } from 'unified';
import _ from 'lodash';
import classNames from 'classnames';
import convert from 'unist-util-is/convert';
import { promises as fs } from 'fs';
import nodeToString from 'hast-util-to-string';
import path from 'path';

const grammars = (() => {
  type Grammar = {
    readonly name: string;
    readonly shortNames: readonly string[];
    readonly scopeName: string;
    readonly definitionFile: string;
  };

  // to find more; go here: https://github.com/microsoft/vscode/find/master and search for tmLanguage
  const grammars: Grammar[] = [
    {
      name: 'Rust',
      shortNames: ['rust'],
      scopeName: 'source.rust',
      definitionFile: 'rust.tmLanguage.json',
    },
    {
      name: 'Jsonnet',
      shortNames: ['jsonnet', 'libjsonnet'],
      scopeName: 'source.jsonnet',
      definitionFile: 'jsonnet.tmLanguage.json',
    },
    {
      name: 'FSharp',
      shortNames: ['fsharp', 'fsx', 'fs'],
      scopeName: 'source.fsharp',
      definitionFile: 'fsharp.tmLanguage.json',
    },
    {
      name: 'JSON',
      shortNames: ['json'],
      scopeName: 'source.json',
      definitionFile: 'JSON.tmLanguage.json',
    },
    {
      name: 'C#',
      shortNames: ['c#', 'csharp', 'dotnet'],
      scopeName: 'source.cs',
      definitionFile: 'csharp.tmLanguage.json',
    },
  ];

  const langs = new Map<string, Grammar>();
  const scopes = new Map<string, Grammar>();
  for (const g of grammars) {
    for (const n of g.shortNames) {
      langs.set(n, g);
    }

    scopes.set(g.scopeName, g);
  }

  return Object.freeze({
    byLang(name: string): Grammar | null {
      return langs.get(name) ?? null;
    },

    byScope(name: string): Grammar | null {
      return scopes.get(name) ?? null;
    },

    scopes: Object.freeze([...scopes.keys()]),
    langs: Object.freeze([...langs.keys()]),
  });
})();

const onigLib = (() => {
  const lib: IOnigLib = {
    createOnigScanner: (sources) => new OnigScanner(sources),
    createOnigString: (str) => new OnigString(str),
  };

  const load = async () => {
    const onigurumaPath = path.resolve('node_modules', 'vscode-oniguruma', 'release');
    const wasmPath = path.resolve(onigurumaPath, 'onig.wasm');
    const data = await fs.readFile(wasmPath);

    try {
      await loadWASM(data.buffer);
    } catch (e) {}
  };

  const result = load().then(() => lib);
  return result;
})();

const registry = new Registry({
  onigLib: onigLib,
  loadGrammar: async (scopeName) => {
    const grammar = grammars.byScope(scopeName);
    if (!grammar) {
      console.warn(`Unknown scope name: ${scopeName} (not in: ${grammars.scopes})`);
      return null;
    }

    const file = path.resolve('lib', 'highlighting', 'grammars', grammar.definitionFile);
    const content = await fs.readFile(file, 'utf-8');
    return parseRawGrammar(content, file);
  },
});

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

const highlightCode = async (content: string, lang: string): Promise<Node | null> => {
  const grammarMeta = grammars.byLang(lang);
  if (!grammarMeta) return null;

  const grammar = await registry.loadGrammar(grammarMeta.scopeName);
  if (!grammar) return null;

  //console.log(`tokenizing ${lang}: \n${content}`);
  let ruleStack = INITIAL;
  let current: HTMLNode = h('span', { class: classesFromScope(grammarMeta.scopeName) });
  const stack: HTMLNode[] = [current];
  const scopeStack = [grammarMeta.scopeName];
  for (const line of lines(content)) {
    const { tokens, ruleStack: nextRuleStack } = grammar.tokenizeLine(line, ruleStack);
    for (const token of tokens) {
      while (
        scopeStack.length > token.scopes.length ||
        scopeStack[scopeStack.length - 1] !== token.scopes[scopeStack.length - 1]
      ) {
        current = stack.pop()!;
        scopeStack.pop();
      }
      for (const scope of token.scopes.slice(stack.length)) {
        stack.push(current);
        const next = h('span', { class: classesFromScope(scope) });
        current.children.push(next);
        scopeStack.push(scope);
        current = next;
      }

      const text = line.substring(token.startIndex, token.endIndex);
      //console.log(`${text}: ${token.scopes.join('|')}`);
      current.children.push({ type: 'text', value: text });
    }
    ruleStack = nextRuleStack;
    current.children.push({ type: 'text', value: '\n' });
  }

  while (stack.length > 0) {
    current = stack.pop()!;
  }
  //console.log(`produced tokens: ${nodes.length}`);
  return current;
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
    node.children = [result];
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
