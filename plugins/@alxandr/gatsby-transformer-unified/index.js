const unified = require('unified');

const makeExport = (name, value) => {
  Object.defineProperty(exports, name, { value });
};

const _content = '___content___';
makeExport('_content', _content);

const createCache = cache => {
  return {
    get: (node, type) => cache.get(`${node.cacheKey}|${type}`),
    set: (node, type, value) => cache.set(`${node.cacheKey}|${type}`, value),
  };
};
makeExport('createCache', createCache);

const attachGatsby = ({ getAux }) => {
  function gatsbyAttacher() {
    this.gatsby = {
      aux: {},
      ext: {},
      getAux,
    };
  }

  return gatsbyAttacher;
};
makeExport('attachGatsby', attachGatsby);

const auxSaver = saveAux => {
  return function auxSaverAttacher() {
    const { gatsby } = this;
    return function auxSaverTransform() {
      saveAux(gatsby.aux);
    };
  };
};

const getPlugins = pluginOptions =>
  pluginOptions.plugins.map(plugin => require(plugin.resolve));
makeExport('getPlugins', getPlugins);

const process = async (node, getNode) => {
  const currentPlugin = getNode('Plugin @alxandr/gatsby-transformer-unified');
  const { pluginOptions } = currentPlugin;
  const plugins = getPlugins(pluginOptions);

  const processor = unified();
  processor.use(attachGatsby({ getAux: null }));
  processor.use(plugins);
  const auxPromise = new Promise(resolve => {
    processor.use(auxSaver(resolve)).freeze();
  });

  const processed = await processor.process(node.internal.content);
  const aux = await auxPromise;
  aux[_content] = processed.contents;
  Object.freeze(aux);
  return aux;
};

const makeGetAux = ({ cache: cacheStore, getNode }) => async node => {
  const cache = createCache(cacheStore);
  const cached = await cache.get(node, 'aux');
  if (cached) {
    return cached;
  }

  const aux = await process(node, getNode);
  await cache.set(node, 'aux', aux);
  return aux;
};
makeExport('makeGetAux', makeGetAux);
