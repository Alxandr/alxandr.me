const { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } = require('next/constants');
const withFonts = require('next-fonts');

module.exports = (phase /*: string */) => {
  // when started in development mode `next dev` or `npm run dev` regardless of the value of STAGING environmental variable
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  // when `next build` or `npm run build` is used
  const isProd = phase === PHASE_PRODUCTION_BUILD && process.env.STAGING !== '1';
  // when `next build` or `npm run build` is used
  const isStaging = phase === PHASE_PRODUCTION_BUILD && process.env.STAGING === '1';

  if (!isDev) {
    console.log(`isProd:${isProd}   isStaging:${isStaging}`);
  }

  const includeDrafts = isDev || isStaging;

  if (isProd && !process.env.GA_TRACKING_ID) {
    console.warn('Missing env var: GA_TRACKING_ID');
  }

  const env = {
    INCLUDE_DRAFTS: includeDrafts ? 'true' : 'false',
    GA_TRACKING_ID: !isDev ? process.env.GA_TRACKING_ID : '',
  };

  return withFonts({ env });
};
