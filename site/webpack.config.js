const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: [
    'whatwg-fetch',
    './src/index',
  ],
  output: {
    path: 'public/',
    filename: 'bundle.js',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
    ],
  },
  plugins: [
    new ExtractTextPlugin('bundle.css'),
  ],
};
