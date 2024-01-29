import Route from '@ember/routing/route';

import { DEMO_LIST } from 'test-app-for-graphics-core/utils/demos';

import type Controller from '@ember/controller';
import type Transition from '@ember/routing/-private/transition';
import type { DemoType } from 'test-app-for-graphics-core/utils/demos';

export default class Cs3dViewRoute extends Route {
  model({ id }: { id: string }) {
    let demo = DEMO_LIST.find((demo) => {
      return demo.id === id;
    });

    return {
      demo,
      title: id,
    };
  }

  setupController(controller: Controller, model: DemoType, transition: Transition) {
    super.setupController(controller, model, transition);
    // eslint-disable-next-line
    // @ts-ignore
    controller.setProperties(model);
  }
}
