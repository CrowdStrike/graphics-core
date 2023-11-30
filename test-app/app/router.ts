import EmberRouter from '@ember/routing/router';

import config from 'test-app-for-graphics-core/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  /**
   * This is a non-ember convention that CrowdStrike uses
   */
  this.route('routes', { path: '/' }, function () {
    this.route('demos');
    this.route('demo-viewer', { path: '/view/:id' });
    this.route('instanced-attributes');
    this.route('label-generator');
    this.route('multi-texture-shader');
    this.route('edges-v2');
    this.route('edge-types');
    this.route('entity-types');
    this.route('vertex-playground');
  });
});
