import  './styl/main.styl';
import { highlightBlock as highlightElement } from 'highlight.js';
import 'highlight.js/lib/languages/fsharp';

const domready = fn => {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
};

domready(() => {
  const codeBlocks = document.querySelectorAll('pre > code');
  for (let i = 0; i < codeBlocks.length; i++) {
    const codeBlock = codeBlocks[i];
    if (codeBlock.childNodes.length < 2) {
      // Probably not syntax highlighted
      highlightElement(codeBlock);
    }
  }

  const body = document.body;
  const header = document.querySelector('header.header');
  const doScroll = () => {
    if (body.scrollTop > 300) {
      header.classList.add('sticky');
    } else {
      header.classList.remove('sticky');
    }
  };
  document.addEventListener('scroll', doScroll);
  doScroll();
});
