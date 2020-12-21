const fs = require('fs');
const path = require('path');
const {merge} = require('webpack-merge');
const common = require('./webpack.common');
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    liveReload: true,
    hot: false,
    port: 9060,
    historyApiFallback: true,
    // writeToDisk: true,
    https: true,
    key: fs.readFileSync('./cert/localhost-key.pem'),
    cert: fs.readFileSync('./cert/localhost.pem'),
    // index: 'index.html',
    // openPage: './dist'
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  output: {
    publicPath: './',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    pathinfo: false,
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        // include: './src',
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            cacheDirectory: false,
            plugins: [
              '@babel/plugin-proposal-class-properties',
              "@babel/plugin-proposal-private-methods",
            ],
          },
        },
      },
    ],
  },
  plugins: [
    // new ForkTsCheckerWebpackPlugin({
    //   eslint: {
    //     enabled: true,
    //     files: '**/*.{ts, tsx, js, jsx}'
    //   },
    //   logger: {
    //     issues: 'console',
    //     devServer: true,
    //   }
    // })
  ],
});