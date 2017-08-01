import CleanCSS from 'clean-css';
import React from 'react';
import jss from 'jss';
import { merge } from 'lodash';
import normalize from 'normalize-jss';
import preset from 'jss-preset-default';

const cssCleaner = new CleanCSS({});
jss.setup(preset());

const raleway = '"Raleway", sans-serif';
const robotoSlab = '"Roboto Slab", serif';

const styleSheet = merge({}, normalize, {
  '@global': {
    '*': {
      boxSizing: 'border-box',
    },

    'html, body': {
      width: '100%',
      height: '100%',
      padding: 0,
      margin: 0,
    },

    body: {
      fontFamily: raleway,
      fontSize: '1em',
      color: '#454441',
      backgroundColor: '#fff',
    },

    'h1, h2, h3, h4, h5, h6': {
      marginTop: '.8em',
      marginBottom: '.4em',
      fontFamily: robotoSlab,
      fontWeight: 'lighter',
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale',
    },

    p: {
      marginBottom: '1.3rem',
      lineHeight: '1.7em',
    },

    'ul, ol, dl': {
      marginBottom: '15px',
    },

    dl: {
      width: '100%',
      overflow: 'hidden',
      padding: 0,
      margin: 0,

      '& dt': {
        float: 'left',
        clear: 'left',
        width: '30%',
        textAlign: 'right',
        fontWeight: 'bold',
        margin: 0,
        padding: 0,

        '&:after': {
          content: '":"',
        },
      },

      '& dd': {
        float: 'left',
        width: '70%',
        padding: 0,
        paddingLeft: '5px',
        margin: 0,
      },
    },

    'li, dd, dt': {
      lineHeight: '1.7em',
      marginBottom: '0.5em',
    },

    hr: {
      position: 'relative',
      margin: '40px 0',
      border: 0,
      borderTop: '1px solid #eee',
      borderBottom: '1px solid #fff',
    },

    strong: {
      color: '#222',
      fontWeight: 'bold',
    },

    abbr: {
      backgroundColor: '#eee',
      display: 'inline-block',
      padding: 3,
      fontSize: '0.8em',
      fontWeight: 'bold',
      color: '#555',
      textShadow: '0 1px 1px rgba(255, 255, 255, 0.5)',
      textTransform: 'uppercase',
      borderRadius: 3,
    },

    'code, pre': {
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    },

    code: {
      fontFamily: '"Fira Mono", consolas, monospace',
      padding: '.25em .5em',
      fontSize: '.85em',
      color: '#bf616a',
      backgroundColor: '#f9f9f9',
      borderRadius: 3,

      '& .hljs-comment': { color: '#999' },
      '& .hljs-keyword': { color: '#006699' },
      '& .hljs-operator': { color: '#555555' },
      '& .hljs-number': { color: '#FF6600' },
      '& .hljs-string': { color: '#d44950' },
      '& .hljs-meta': { color: '#4f9fcf' },
      '& .hljs-class .hljs-title': { color: '#00AA88' },
    },

    pre: {
      display: 'block',
      margin: '0 0 14px',
      padding: '15px 20px',
      fontSize: '0.9rem',
      whiteSpace: 'pre',
      backgroundColor: '#f9f9f9',
      overflowX: 'auto',

      '& code': {
        padding: 0,
        fontSize: '1em',
        color: 'inherit',
        backgroundColor: 'transparent',
      },
    },

    '.highlight': {
      marginBottom: 15,
      borderRadius: 4,

      '& pre': {
        marginBottom: 0,
      },
    },

    blockquote: {
      padding: '5px 30px 5px 25px',
      margin: '15px 0',
      borderLeft: '5px solid #eee',

      '& p': {
        marginBottom: 0,
        marginTop: 0,
        color: '#7a7a7a',
      },
    },

    img: {
      display: 'block',
      margin: '0 0 15px',
      borderRadius: 15,
    },

    a: {
      color: '#e25440',
      textDecoration: 'none',
      cursor: 'pointer',

      '&:hover, &:focus': {
        color: '#b9301c',
        transition: 'color .2s',
      },
    },
  },

  root: {
    height: '100%',
    width: '100%',
    padding: 0,
    margin: 0,
  },
});

const overrides = {
  '@global': {
    h1: {
      marginTop: 0,
      fontSize: '3.2rem',
      lineHeight: '1.2em',
      letterSpacing: '.05em',
    },

    h2: {
      fontSize: '2.2rem',
    },

    h3: {
      fontSize: '1.8rem',
    },

    h4: {
      fontSize: '1.4rem',
    },

    h5: {
      fontSize: '1.2rem',
    },

    h6: {
      fontSize: '1rem',
    },
  },
};

const Root = ({ body, postBodyComponents, headComponents }) => {
  const sheet1 = jss.createStyleSheet(styleSheet);
  const sheet2 = jss.createStyleSheet(overrides);
  const { classes } = sheet1;
  const css = sheet1.toString() + '\n' + sheet2.toString();

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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Raleway:400,700|Roboto+Slab:300,400|Fira+Mono:400)"
        />
        <style
          type="text/css"
          dangerouslySetInnerHTML={{
            __html: cssCleaner.minify(css).styles,
          }}
        />
        {headComponents}
      </head>
      <body>
        <div
          id="___gatsby"
          dangerouslySetInnerHTML={{ __html: body }}
          className={classes.root}
        />
        {postBodyComponents}
      </body>
    </html>
  );
};

export default Root;
