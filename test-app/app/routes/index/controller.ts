import { tracked } from '@glimmer/tracking';
import Controller from '@ember/controller';
import { action } from '@ember/object';

import { DEMO_LIST, DEMO_TAGS } from 'test-app-for-graphics-core/utils/demos';

export default class LabelGeneratorModifierController extends Controller {
  @tracked activeFilter?: string;

  @action
  onDemoFilter(tag: string | undefined) {
    this.activeFilter = tag;
  }

  get allDemos() {
    return DEMO_LIST.slice();
  }

  get filteredDemos() {
    if (!this.activeFilter) {
      return this.allDemos;
    } else {
      return this.allDemos.filter((d) => {
        return d.tags.includes(this.activeFilter ?? '');
      });
    }
  }

  @action
  isFiltered(tags: string[]) {
    if (!this.activeFilter) {
      return false;
    }

    return tags.includes(this.activeFilter);
  }

  get demoTags() {
    return Object.values(DEMO_TAGS);
  }
}
