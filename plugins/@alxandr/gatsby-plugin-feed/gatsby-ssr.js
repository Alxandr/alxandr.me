const React = require('react');
const { defaultOptions } = require('./internals');
const merge = require('lodash.merge');

exports.onRenderBody = ({ setHeadComponents }, pluginOptions) => {
  const { feeds } = merge({}, defaultOptions, pluginOptions);

  const links = Object.keys(feeds).map((output, i) => {
    if (output.charAt(0) !== '/') {
      output = '/' + output;
    }

    return (
      <link
        key={`gatsby-plugin-feed-${i}`}
        rel="alternate"
        type="application/atom+xml"
        title="Alxandr.me"
        href={output}
      />
    );
  });

  setHeadComponents(links);
};
