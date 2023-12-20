'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const tailwindConfig = require('./tailwind.config');
const withSideWatch = require('./config/with-side-watch');

const isProduction = () => EmberApp.env() === 'production';

const {
  configureCSSModules,
  configureTailwind,
} = require('@crowdstrike/ember-toucan-styles/ember-cli');

process.env.EMBROIDER_TEST_SETUP_OPTIONS = 'optimized';

console.debug({ configureTailwind, configureCSSModules });

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    ...configureCSSModules({ tailwindConfig }),
    trees: {
      app: withSideWatch('app', { watching: ['../package'] }),
    },
    name: 'test-app',
  });

  const { maybeEmbroider } = require('@embroider/test-setup');

  return maybeEmbroider(app, {
    packagerOptions: {
      publicAssetURL: '/',
      cssLoaderOptions: {
        sourceMap: isProduction() === false,
        // Native CSS Modules
        modules: {
          // global mode, can be either global or local
          // we set to global mode to avoid hashing tailwind classes
          mode: 'global',
          // class naming template
          localIdentName: isProduction()
            ? '[sha512:hash:base64:5]'
            : '[path][name]__[local]',
        },
      },
      webpackConfig: {
        output: {
          assetModuleFilename: '[path][name]-[contenthash][ext]',
        },
        module: {
          rules: [
            {
              // When webpack sees an import for a CSS files
              test: /\.css$/i,
              exclude: /node_modules/,
              use: [
                {
                  loader: 'postcss-loader',
                  options: {
                    sourceMap: isProduction() === false,
                    postcssOptions: {
                      config: 'postcss.config.js',
                    },
                  },
                },
              ],
            },
            {
              test: /\.(png|jpg|gif)$/i,
              type: 'asset/resource',
            },
          ],
        },
      },
    },
  });
};
