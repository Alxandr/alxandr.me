/* global ga:true */

const getPath = location => location.pathname + location.search;

exports.onRouteUpdate = ({ location }) => {
  setTimeout(() => {
    // Don't track while developing.
    if (process.env.NODE_ENV === 'production' && typeof ga === 'function') {
      ga('set', {
        page: getPath(location || window.location),
        title: document.title,
      });
      ga('send', 'pageview');
    } else {
      // eslint-disable-next-line no-console
      console.log(
        `${getPath(location || window.location)} - ${document.title}`,
      );
    }
  }, 500);
};
