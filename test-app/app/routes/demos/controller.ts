import Controller from '@ember/controller';

import { DEMO_LIST } from 'test-app-for-graphics-core/utils/demos';

export default class LabelGeneratorModifierController extends Controller {
  get demos() {
    return DEMO_LIST.slice();
  }
}
