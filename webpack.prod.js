const path = require('path');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
// const AppManifestWebpackPlugin = require('app-manifest-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  // devtool: 'eval-source-map',
  devtool: false,
  optimization: {
    // moduleIds: 'deterministic',
    moduleIds: 'hashed',
    runtimeChunk: 'single',
    nodeEnv: 'production',
    removeEmptyChunks: false,
    mergeDuplicateChunks: false,
    splitChunks: {
      chunks: 'all',
      minSize: 10000,
      maxSize: 50000,
      automaticNameDelimiter: '-chunk-',
      cacheGroups: {
        vendor: {
          test: /\/node_modules\//,
          name: 'vendors',
          reuseExistingChunk: true,
          chunks: 'all'
        },
        lib: {
          test: /\/lib\//,
          name: 'lib',
          reuseExistingChunk: true,
          chunks: 'all'
        }
      },
    },
    minimize: true,
    minimizer: [
      new TerserJSPlugin(),
      new OptimizeCSSAssetsPlugin(),
    ],
  },
  output: {
    publicPath: './',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    // filename: (pathData) => {
    //   return pathData.chunk.name === 'sw' ? '[name].js': '[name].[contenthash].js';
    // },
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            cacheDirectory: false,
            plugins: [
              '@babel/plugin-proposal-class-properties',
              "@babel/plugin-proposal-private-methods",
              "@babel/plugin-syntax-optional-chaining",
              "@babel/plugin-proposal-logical-assignment-operators",
            ],
          },
        },
      },
    ],
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    // new ForkTsCheckerWebpackPlugin({
    //   eslint: {
    //     enabled: true,
    //   }
    // }),
    // new AppManifestWebpackPlugin({
    //   logo: './src/assets/favicons/logo.svg',
    //   prefix: '/dist/',
    //   output: '/assets/favicons/icons-[hash:8]/',
    //   emitStats: true,
    //   statsFilename: 'iconstats.json',
    //   statsEncodeHtml: false,
    //   persistentCache: true,
    //   inject: true,
    //   // config: {},
    // }),
  ],
});
