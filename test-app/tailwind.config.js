'use strict';

const path = require('path');

const appRoot = __dirname;
const appEntry = path.join(appRoot, 'app');
const relevantFilesGlob = '**/*.{html,js,ts,hbs,gjs,gts}';

console.log(
  path.join(appEntry, relevantFilesGlob)
)

module.exports = {
  content: [path.join(appEntry, relevantFilesGlob)],
  presets: [require('@crowdstrike/tailwind-toucan-base')],

  plugins: [],
};
