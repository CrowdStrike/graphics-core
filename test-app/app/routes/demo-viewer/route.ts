import Route from '@ember/routing/route';

import { DEMO_LIST } from 'test-app-for-graphics-core/utils/demos';

import type Controller from '@ember/controller';

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

  setupController(controller: Controller, model: any) {
    controller.setProperties(model);
  }
}
