const React = require('react');

exports.onRenderBody = ({ setPostBodyComponents }, pluginOptions) => {
  if (process.env.NODE_ENV === 'production') {
    return setPostBodyComponents([
      <script
        key="google-analytics-bootstrap-script"
        dangerouslySetInnerHTML={{
          __html: `window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;ga('create', '${pluginOptions.trackingId}', 'auto');if(navigator.sendBeacon)ga('set', 'transport', 'beacon');ga('send', 'pageview');`,
        }}
      />,
      <script
        key="google-analytics-import-script"
        async
        src="https://www.google-analytics.com/analytics.js"
      />,
    ]);
  }
};
