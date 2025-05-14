const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production', // or 'development'
  entry: {
    'googlenews': './googlenews.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'inline-source-map', // For development
  // OR for production:
  // devtool: 'source-map',
  optimization: {
    minimize: false // Disable minification during development
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'icon128.png', to: '.' }, // if you have icons
        { from: 'background.js', to: '.' }, // if you have a popup
      ],
    }),
  ],
};