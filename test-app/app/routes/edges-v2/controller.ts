import Controller from '@ember/controller';

import { EdgeDemoModifier } from './edge-demo-modifier';

export default class LabelGeneratorModifierController extends Controller {
  demo = EdgeDemoModifier;
  queryParams = ['count'];
  count = 2000;
}
