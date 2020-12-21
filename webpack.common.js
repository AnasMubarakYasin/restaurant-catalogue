const path = require('path');
const CSSExtractPlugin = require('mini-css-extract-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const WebpackAssetsManifest = require('webpack-assets-manifest');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const {InjectManifest} = require('workbox-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default

const mode = process.argv.includes('production') ? 'production' : 'development'
const sourceMap = mode === 'production' ? false : true;

const fileLoaderOption = {
  esModule: true,
  name: mode === 'production' ? '[name].[contenthash].[ext]' : '[name].[ext]',
  emitFile: true,
  outputPath: (url, resourcePath, context) => {
    return outputPath(url, resourcePath, context);
  },
  publicPath: (url, resourcePath, context) => {
    return outputPath(url, resourcePath, context);
  },
};
const imageOption = {
  mozjpeg: {
    progressive: true,
    smooth: 50,
    quality: 50,
  },
  optipng: {
    quality: 50,
    optimizationLevel: 6,
  },
  pngquant: {
    speed: 5,
    strip: true,
    quality: 50,
    verbose: true,
  },
  gifsicle: {
    optimizationLevel: 1,
  },
  webp: {
    preset: 'picture',
    quality: 50,
    method: 6,
    size: 50000,
  },
  svgo: {}
}

module.exports = {
  name: 'food-hunt-web-app',
  entry: {
    index: './src/scripts/index.js',
  },
  optimization: {
    usedExports: true,
  },
  plugins: [
    new CleanWebpackPlugin({
      verbose: true,
    }),
    // new PreloadWebpackPlugin({
    //   rel: 'preload',
    //   // include: 'allChunks',
    //   // include: 'allAssets',
    //   include: 'initial',
    //   fileBlacklist: [
    //     /md$/,
    //     /codepoints$/,
    //     /ijmap$/,
    //     /\.(png|jpg|jpeg|svg)$/,
    //     /\.(html|json)$/,
    //     /\.(eot|ttf|woff)$/,
    //   ],
    //   // chunks: ['index'],
    //   as(entry) {
    //     if (/\.css$/.test(entry)) {
    //       return 'style'
    //     };
    //     if (/\.(woff|eot|ttf|woff2|)$/.test(entry)) {
    //       return 'font'
    //     };
    //     if (/\.(png|jpg|jpeg)$/.test(entry)) {
    //       return 'image'
    //     };
    //     if (/\.(html)$/.test(entry)) {
    //       return 'document'
    //     };
    //     return 'script';
    //   },
    // }),
    new HtmlWebpackPlugin({
      title: 'main',
      filename: 'index.html',
      template: './src/templates/index.html',
      inject: true,
      minify: true,
      scriptLoading: 'defer',
      favicon: './src/public/images/logo/foodhunt.png',
      meta: {
        'description': 'web app wich providing list of restaurant',
      },
    }),
    new CSSExtractPlugin({
      filename: mode === 'production' ? '[name].[contenthash].css' : '[name].css',
    }),
    // new CopyPlugin({
    //   patterns: [
    //     {
    //       from: './src/public/',
    //       to: './public/',
    //     },
    //   ],
    // }),
    new WebpackPwaManifest({
      filename: 'manifest.json',
      includeDirectory: true,
      fingerprints: true,
      crossorigin: null,
      inject: true,
      ios: {
        'apple-mobile-web-app-title': 'FoodHunt',
        'apple-mobile-web-app-status-bar-style': '#cb4900',
      },
      name: 'FoodHunt Web App',
      short_name: 'FoodHunt',
      start_url: '/',
      background_color: '#ff8f44',
      theme_color: '#ff8f44',
      categories: ['food', 'drink', 'restaurant'],
      description: 'web app wich providing list of restaurant',
      dispalay: 'standalone',
      orientation: 'any',
      scope: './',
      lang: 'id',
      dir: 'auto',
      iarc_rating_id: '',
      icons: [
        {
          src: './src/public/images/logo/foodhunt-192px.png',
          size: 192,
          type: 'png',
          ios: true,
          destination: './public/images/logo/',
        },
        {
          src: './src/public/images/logo/foodhunt.png',
          size: 512,
          type: 'png',
          ios: true,
          destination: './public/images/logo/',
        },
        {
          src: './src/public/images/logo/foodhunt.svg',
          sizes: [48, 96, 144, 192, 240, 512],
          purpose: 'maskable',
          type: 'image/svg+xml',
          ios: true,
          destination: './public/images/logo/',
        },
      ],
      prefer_related_applications: false,
      related_applications: [{
        "platform": "webapp",
        "url": "http://127.0.0.1:8887/manifest.json",
      }],
    }),
    new ImageminPlugin({
      test: /\.(jpe?g|png|gif|svg)$/i,
      disable: mode === 'production' ? false : true,
      overrideExtension: true,
      ...imageOption,
    }),
    new InjectManifest({
      swSrc: './src/scripts/sw.js',
      swDest: 'sw.js',
      mode,
    }),
    new WebpackAssetsManifest({
      output: 'resource.json',
      writeToDisk: true,
    }),
  ],
  module: {
    rules: [
      {
        sideEffects: true,
      },
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          attributes: true,
          minimize: {
            removeComments: true,
            collapseWhitespace: true,
            minifyCSS: false,
            minifyJS: false,
          },
          esModule: true,
        },
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          CSSExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              modules: {
                exportLocalsConvention: 'camelCase',
                localIdentName: mode === "development" ? '[path][name]-[local]' : '[hash]',
                exportGlobals: true,
                mode: (resourcePath) => {
                  if (/\.module\./igm.test(resourcePath)) {
                    return 'local';
                  }
                  if (/.*\.pure\.(css|s[ac]ss)$/i.test(resourcePath)) {
                    return 'pure';
                  }
                  return 'global';
                },
              },
              esModule: true,
              sourceMap,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              sourceMap,
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              happyPackMode: mode === 'development' ? false : true,
            },
          },
        ],
        exclude: /node_modules/
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'file-loader',
            options: fileLoaderOption,
          },
        ],
      },
      {
        test: /\.(csv|tsv)$/,
        use: [
          {
            loader: 'csv-loader',
            options: fileLoaderOption,
          },
        ],
      },
      {
        test: /\.xml$/,
        use: [
          {
            loader: 'xml-loader',
            options: fileLoaderOption,
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: fileLoaderOption,
          },
          {
            loader: 'image-webpack-loader',
            options: imageOption,
          },
        ],
      },
      {
        test: /\.mp4$/,
        use: [
          {
            loader: 'file-loader',
            options: fileLoaderOption,
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
};

function outputPath (url, resourcePath, context) {
  if (/\.(png|jpg)$/.test(resourcePath)) {
    return `public/images/${url}`;
  } else if (/\.(svg)$/.test(resourcePath)) {
    return `public/svg/${url}`;
  } else if (/\.(gif)$/.test(resourcePath)) {
    return `public/gif/${url}`;
  } else if (/\.(woff|woff2|eot|ttf|otf)$/.test(resourcePath)) {
    return `public/fonts/${url}`;
  } else if (/\.(csv|tsv|xml)$/.test(resourcePath)) {
    return `public/data/${url}`;
  } else if (/\.mp4$/.test(resourcePath)) {
    return `public/videos/${url}`;
  }
  return `public/another/${url}`;
}
