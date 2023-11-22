import Controller from '@ember/controller';

import { EntityTypesModifier } from './entity-types-modifier';

export default class LabelGeneratorModifierController extends Controller {
  demo = EntityTypesModifier;
  queryParams = ['count'];
  count = 100;
}
