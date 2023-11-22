import { registerDestructor } from '@ember/destroyable';

import Modifier from 'ember-modifier';

import { LineEntitiesDemo } from './line-entities-demo';

import type ApplicationInstance from '@ember/application/instance';
import type { ArgsFor } from 'ember-modifier';

interface Args {
  Args: {
    Positional: [numberOfEdges: number];
  };
}

export class EntityTypesModifier extends Modifier<Args> {
  args: ArgsFor<Args>;
  lineDemo: LineEntitiesDemo;

  constructor(owner: ApplicationInstance, args: ArgsFor<Args>) {
    super(owner, args);
    registerDestructor(this, () => this.dispose());
    this.lineDemo = new LineEntitiesDemo();
    this.args = args;
  }

  async modify(element: HTMLElement) {
    this.lineDemo.init(element);
  }

  dispose() {
    this.lineDemo.dispose();
  }
}

export interface FixtureItem {
  height: number;
  depth: number;
  children: FixtureItem[];
  parent?: FixtureItem;
  // data: any;
  x: number;
  y: number;
}
