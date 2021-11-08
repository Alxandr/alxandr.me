declare module 'hastscript' {
  import { Element, ElementContent } from 'hast';

  function h(type: string): Element;
  function h(type: string, attributes: { readonly [name: string]: string }): Element;
  function h(type: string, children: readonly ElementContent[]): Element;
  function h(type: string, ...children: readonly ElementContent[]): Element;
  function h(
    type: string,
    attributes: { readonly [name: string]: string },
    children: readonly ElementContent[],
  ): Element;
  function h(
    type: string,
    attributes: { readonly [name: string]: string },
    ...children: readonly ElementContent[]
  ): Element;

  export = h;
}
