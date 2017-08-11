const { GraphQLString, GraphQLNonNull } = require('graphql');
const unified = require('unified');
const { _content, makeGetAux, getPlugins, attachGatsby } = require('./index');

const extSaver = saveExt => {
  return function extSaverAttacher() {
    const { gatsby } = this;
    saveExt(gatsby.ext);
  };
};

const extendNodeType = async ({ type, cache, getNode }, pluginOptions) => {
  if (type.name !== 'Unified') {
    return null;
  }

  const getAux = makeGetAux({ cache, getNode });
  const plugins = getPlugins(pluginOptions);
  const processor = unified();

  processor.use(
    attachGatsby({
      getAux,
    }),
  );
  processor.use(plugins);

  processor.freeze();
  const extensions = await new Promise(resolve => {
    processor().use(extSaver(resolve)).freeze();
  });

  return Object.assign(
    {},
    {
      content: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: async node => {
          const aux = await getAux(node);
          return aux[_content];
        },
      },
    },
    extensions,
  );
};

module.exports = extendNodeType;
