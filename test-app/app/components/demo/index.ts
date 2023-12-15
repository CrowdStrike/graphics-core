import Component from '@glimmer/component';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
// eslint-disable-next-line
import { cached } from '@glimmer/tracking';

import { NumberUtils } from '@crowdstrike/graphics-core';
import GraphViewConfiguration from 'test-app-for-graphics-core/utils/graph-view-configuration';

import type { ThreeJSViewParams } from '@crowdstrike/graphics-core';
import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';
import type { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';

interface Args {
  demoClass: new (p: EmberComponentInterfaceParams) => ThreeJsComponentInterface<unknown>;
  viewSettings: ThreeJSViewParams;
}

export default class DemoComponent extends Component<Args> {
  @cached
  get falconGraphViewData() {
    let config = new GraphViewConfiguration({
      assetId: NumberUtils.generateUUID(),
      shouldAutoRender: true,
      shouldDispose: true,
      data: {},
      EmberComponentInterfaceClass: this.args.demoClass,
      isActive: true,
      isFullScreen: true,
      threeJSParams: this.args.viewSettings,
    });

    return config;
  }
}
