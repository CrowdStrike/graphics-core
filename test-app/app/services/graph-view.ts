import Service, { inject as service } from '@ember/service';

import type { Theme, ThemeManager } from '@crowdstrike/ember-toucan-styles';
import type ApplicationInstance from '@ember/application/instance';
import type { EntityDisplayState , ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';

// eslint-disable-next-line @typescript-eslint/ban-types
type FunctionKeyof<T> = { [k in keyof T]: T[k] extends Function ? k : never }[keyof T];

export default class GraphViewService extends Service {
  @service declare themeManager: ThemeManager;
  views: Record<string, ThreeJsComponentInterface> = {};

  constructor(owner: ApplicationInstance) {
    super(owner);
    this.themeManager.registerThemeSwitchListener((themeName: Theme) => {
      Object.values(this.views).forEach((view) => {
        view.updateTheme(themeName);
      });
    });
  }

  get hasWebGL() {
    try {
      let canvas = document.createElement('canvas');

      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  runActionOn<T extends ThreeJsComponentInterface>(
    id: string,
    actionName: FunctionKeyof<T>,
    ...rest: unknown[]
  ) {
    let view = this.views[id];

    if (view) {
      view.runAction<T>(actionName, ...rest);
    }
  }

  getView<T extends ThreeJsComponentInterface>(id: string) {
    return this.views[id] as T;
  }

  addView(id: string, view: ThreeJsComponentInterface) {
    this.views[id] = view;
  }

  removeView(id: string) {
    delete this.views[id];
  }

  setViewState(id: string, state: EntityDisplayState) {
    let view = this.views[id];

    if (view) {
      view.setViewState(state);
    }
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'graph-view': GraphViewService;
  }
}
