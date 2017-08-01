const React = require('react');
const { renderToString } = require('react-dom/server');
const { JssProvider, SheetsRegistry } = require('react-jss');
const CleanCSS = require('clean-css');

const cssCleaner = new CleanCSS({});

exports.replaceRenderer = ({
  bodyComponent,
  replaceBodyHTMLString,
  setHeadComponents,
}) => {
  const sheets = new SheetsRegistry();

  const bodyHTML = renderToString(
    <JssProvider registry={sheets}>
      {bodyComponent}
    </JssProvider>,
  );

  replaceBodyHTMLString(bodyHTML);
  const css = sheets.toString();
  const minCss = cssCleaner.minify(css).styles;
  setHeadComponents([
    <style
      type="text/css"
      id="server-side-jss"
      key="server-side-jss"
      dangerouslySetInnerHTML={{ __html: minCss }}
    />,
  ]);
};
