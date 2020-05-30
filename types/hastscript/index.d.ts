declare module 'hastscript' {
  import { Node } from 'unist';

  type Child = Node | string;

  export interface HTMLNode extends Node {
    children: Node[];
  }

  function h(type: string): HTMLNode;
  function h(type: string, attributes: { readonly [name: string]: string }): HTMLNode;
  function h(type: string, children: readonly Child[]): HTMLNode;
  function h(type: string, ...children: readonly Child[]): HTMLNode;
  function h(type: string, attributes: { readonly [name: string]: string }, children: readonly Child[]): HTMLNode;
  function h(type: string, attributes: { readonly [name: string]: string }, ...children: readonly Child[]): HTMLNode;

  export = h;
}
