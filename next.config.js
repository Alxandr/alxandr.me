const { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } = require('next/constants');

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

  const env = {
    INCLUDE_DRAFTS: includeDrafts ? 'true' : 'false',
  };

  return { env };
};
