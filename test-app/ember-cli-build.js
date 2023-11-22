'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

const {
  configureCSSModules,
  configureTailwind,
} = require('@crowdstrike/ember-toucan-styles/ember-cli');
const tailwindConfig = require('./tailwind.config');

// Intimate / Private information:
// https://github.com/embroider-build/embroider/blob/main/packages/test-setup/src/index.ts#L85
process.env.EMBROIDER_TEST_SETUP_OPTIONS = 'optimized';

console.debug({ configureTailwind, configureCSSModules });

module.exports = function (defaults) {
  /**
   * Sets up some optional environment variables to help out with
   * both deploy and local debugging
   *
   * Start `ember s` with any combination of these:
   *  - DISABLE_SOURCEMAPS=true
   *  - DISABLE_UGLIFY=true
   *  - DISABLE_FINGERPRINTING=true
   *
   * Also provides our babel configuration (and consequently, TypeScript support)
   */
  // let buildParams = require('ember-cli-deploy-cs/lib/build-params')();

  // buildParams.autoImport.watchDependencies = Object.keys(require('./package').dependencies);

  let app = new EmberApp(defaults, {
    ...configureCSSModules({ tailwindConfig }),
    /**
     * If we want, we may diverge the "app name" or import path
     * from the rootURL (normally these are tied together)
     *
     * An example of this is where we'd maybe want to
     *   import ... from 'falcon-store/...';
     *   but have the rootURL be: /falcon-store-v2
     *
     * Note that if this is manually changed to be different from the package name
     * the references in both index.html files will also need to be updated
     *
     */
    name: 'test-app',
  });

  const { maybeEmbroider } = require('@embroider/test-setup');

  return maybeEmbroider(app, {
    packagerOptions: {
      // publicAssetURL: buildParams.fingerprint.prepend,
      webpackConfig: {
        output: {
          assetModuleFilename: '[path][name]-[contenthash][ext]',
        },
        module: {
          rules: [
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
