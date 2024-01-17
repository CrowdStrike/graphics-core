import { Addon } from '@embroider/addon-dev/rollup';

import { defineConfig } from 'rollup';
import copy from 'rollup-plugin-copy';
import ts from 'rollup-plugin-ts';

const addon = new Addon({
  srcDir: 'src',
  destDir: 'dist',
});

export default defineConfig({
  // https://github.com/rollup/rollup/issues/1828
  watch: {
    chokidar: {
      usePolling: true,
    },
  },
  output: {
    ...addon.output(),
    sourcemap: true,
  },
  plugins: [
    // These are the modules that users should be able to import from your
    // addon. Anything not listed here may get optimized away.
    addon.publicEntrypoints([
      // For our own build we treat all JS modules as entry points, to not cause rollup-plugin-ts to mess things up badly when trying to tree-shake TS declarations
      // but the actual importable modules are further restricted by the package.json entry points!
      '**/*.ts',
      '**/*.js',
    ]),

    // This babel config should *not* apply presets or compile away ES modules.
    // It exists only to provide development niceties for you, like automatic
    // template colocation.
    //
    // By default, this will load the actual babel config from the file
    // babel.config.json.
    ts({
      // can be changed to swc or other transpilers later
      // but we need the ember plugins converted first
      // (template compilation and co-location)
      transpiler: 'babel',
      babelConfig: './babel.config.cjs',
      browserslist: ['last 2 firefox versions', 'last 2 chrome versions'],
    }),

    // Follow the V2 Addon rules about dependencies. Your code can import from
    // `dependencies` and `peerDependencies` as well as standard Ember-provided
    // package names.
    addon.dependencies(),

    // Remove leftover build artifacts when starting a new build.
    addon.clean(),

    copy({
      targets: [
        {src: '../LICENSE.md', dest: '.'}
      ]
    })
  ],
});
