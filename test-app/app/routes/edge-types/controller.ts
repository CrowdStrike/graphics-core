import Controller from '@ember/controller';

import { EdgeTypesModifier } from './edge-types-modifier';

export default class LabelGeneratorModifierController extends Controller {
  demo = EdgeTypesModifier;
  queryParams = ['count'];
  count = 100;
}
