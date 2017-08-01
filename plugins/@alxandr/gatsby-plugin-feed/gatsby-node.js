const fs = require('fs');
const path = require('path');
//const RSS = require('rss');
const merge = require('lodash.merge');
const { defaultOptions, runQuery } = require('./internals');
const createWriter = require('./atom-writer');

const publicPath = './public';

exports.onPostBuild = async ({ graphql }, pluginOptions) => {
  delete pluginOptions.plugins;

  const options = merge({}, defaultOptions, pluginOptions);
  const metaData = await runQuery(graphql, options.query);
  const feeds = Object.keys(options.feeds);
  for (const feedOutput of feeds) {
    const feed = options.feeds[feedOutput];
    feed.output = feedOutput;

    const feedOptions = merge({}, options, feed);
    const meta = options.transform(metaData, feedOptions);

    const feedData = await runQuery(graphql, feedOptions.query);
    const generatorFn = () =>
      feedOptions.transform(feedData, meta, feedOptions);
    const outputPath = path.join(publicPath, feedOptions.output.substring(1));

    const firstItem = generatorFn()[Symbol.iterator]().next().value;
    meta.updated = firstItem.updated;

    debugger;
    const writer = createWriter(meta, generatorFn);
    const wstream = fs.createWriteStream(outputPath);
    await new Promise((resolve, reject) => {
      writer.pipe(wstream).on('finish', resolve).on('error', reject);
    });
  }
};
