import { tracked } from '@glimmer/tracking';
import Controller from '@ember/controller';
import { action } from '@ember/object';

import { DEMO_LIST, DEMO_TAGS } from 'test-app-for-graphics-core/utils/demos';

export default class LabelGeneratorModifierController extends Controller {
  @tracked activeFilter?: string;

  @action
  onDemoFilter(f: PointerEvent) {
    if (f.target?.dataset?.tag) {
      this.activeFilter = f.target?.dataset?.tag;
    } else {
      this.activeFilter = undefined;
    }
  }

  get allDemos() {
    return DEMO_LIST.slice();
  }

  get filteredDemos() {
    if (!this.activeFilter) {
      return this.allDemos;
    } else {
      return this.allDemos.filter((d) => {
        return d.tags.includes(this.activeFilter);
      });
    }
  }

  get demoTags() {
    return Object.values(DEMO_TAGS);
  }
}
