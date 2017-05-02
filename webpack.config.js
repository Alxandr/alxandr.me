const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const path = require('path');

module.exports = {
  entry: {
    main: './webpack/main'
  },

  output: {
    path: path.resolve(__dirname, 'src/assets/js/'),
    filename: '[name].js',
    chunkFilename: '[id].js'
  },

  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' },
      { test: /\.css$/, use: ExtractTextPlugin.extract(['css-loader']) },
      { test: /\.styl$/, use: ExtractTextPlugin.extract(['css-loader', 'stylus-loader']) },
      { test: /\.(jpe?g|png|gif|svg)$/i, use: 'file-loader?hash=sha512&digest=hex&name=../images/[hash].[ext]' }
    ]
  },

  plugins: [
    new ExtractTextPlugin('../css/[name].css')
  ]
};
