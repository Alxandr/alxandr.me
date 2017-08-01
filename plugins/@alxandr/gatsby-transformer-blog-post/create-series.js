const slug = require('slug');
const { createInternal } = require('./create-internal');

const mergePostsUnique = (...lists) => {
  const set = new Set();
  for (const list of lists) {
    if (list) {
      for (const post of list) {
        set.add(post);
      }
    }
  }

  return [...set];
};

const createSeries = (series, postId, { createNode, getNode }) => {
  const seriesSlug = slug(series);
  const seriesPath = `/series/${seriesSlug}/`;
  const seriesId = `Series < ${seriesPath}`;
  let seriesNode = getNode(seriesId);
  if (seriesNode && !postId) {
    // TODO: This is a series page. We want the info here.

    return seriesId;
  }

  const seriesPosts = mergePostsUnique(seriesNode && seriesNode.posts, [
    postId,
  ]);

  seriesNode = {
    id: seriesId,
    children: [],
    parent: '___SOURCE___',
  };

  seriesNode.name = series;
  seriesNode.slug = seriesSlug;
  seriesNode.path = seriesPath;
  seriesNode.posts = seriesPosts;
  seriesNode.internal = createInternal('Series', seriesNode);

  createNode(seriesNode);
  return seriesId;
};
exports.createSeries = createSeries;
