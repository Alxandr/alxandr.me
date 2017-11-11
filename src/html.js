import PropTypes from 'prop-types';
import React from 'react';
import rootCss from '!raw-loader!stylus-loader!./html.styl';

let stylesStr = rootCss;
if (process.env.NODE_ENV === 'production') {
  try {
    stylesStr += '\n' + require('!raw-loader!../public/styles.css');
  } catch (e) {
    console.error(e); // eslint-disable-line no-console
  }
}

const Root = ({ body, postBodyComponents, headComponents }) => {
  const css = (
    <style
      id="gatsby-inlined-css"
      dangerouslySetInnerHTML={{ __html: stylesStr }}
    />
  );

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, shrink-to-fit=no"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png?v=rMlMBWn9rX"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png?v=rMlMBWn9rX"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png?v=rMlMBWn9rX"
        />
        <link
          rel="mask-icon"
          href="/safari-pinned-tab.svg?v=rMlMBWn9rX"
          color="#5bbad5"
        />
        <link rel="shortcut icon" href="/favicon.ico?v=rMlMBWn9rX" />
        <meta name="apple-mobile-web-app-title" content="Alxandr.me" />
        <meta name="application-name" content="Alxandr.me" />
        <meta name="theme-color" content="#ffffff" />
        {css}
        {headComponents}
      </head>
      <body
        itemScope
        itemType="http://schema.org/Blog"
        itemID="https://alxandr.me/"
      >
        <div
          id="___gatsby"
          dangerouslySetInnerHTML={{ __html: body }}
          className="site-root"
        />
        <noscript id="deferred-styles">
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Raleway:400,700|Roboto+Slab:300,400|Fira+Mono:400)"
          />
        </noscript>
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html:
              '(function(){var b=function(){var d=document.getElementById("deferred-styles"),e=document.createElement("div");e.innerHTML=d.textContent,document.body.appendChild(e),d.parentElement.removeChild(d)},c=requestAnimationFrame||mozRequestAnimationFrame||webkitRequestAnimationFrame||msRequestAnimationFrame;c?c(function(){window.setTimeout(b,0)}):window.addEventListener("load",b)})();',
          }}
        />
        {postBodyComponents}
      </body>
    </html>
  );
};

Root.propTypes = {
  headComponents: PropTypes.node.isRequired,
  body: PropTypes.node.isRequired,
  postBodyComponents: PropTypes.node.isRequired,
};

export default Root;
