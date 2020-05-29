declare module '@mapbox/rehype-prism' {
  // Minimum TypeScript Version: 3.2
  import { Plugin, Processor } from 'unified';
  interface Options {}

  declare const rehypeHighlight: Plugin<[Options?] | [Processor?, Options?]>;

  export = rehypeHighlight;
}
