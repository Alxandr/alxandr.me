var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var minimize = process.argv.indexOf('--minimize') !== -1;

var plugins = [
  new ExtractTextPlugin("../css/[name].css")
];
if (minimize) {
  plugins.push(new webpack.optimize.UglifyJsPlugin());
}

module.exports = {
  entry: {
    main: './webpack/main'
  },
  output: {
    path: 'src/assets/js/',
    filename: '[name].js',
    chunkFilename: '[id].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/i,
        exclude: /node_modules/,
        loader: 'babel'
      },
      {
        test: /\.css$/i,
        loader: ExtractTextPlugin.extract("style", "css")
      },
      {
        test: /\.styl$/i,
        loader: ExtractTextPlugin.extract("style", "css!stylus")
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: 'file?hash=sha512&digest=hex&name=../images/[hash].[ext]'
      }
    ]
  },
  plugins: plugins
};
