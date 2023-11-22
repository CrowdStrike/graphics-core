import { registerDestructor } from '@ember/destroyable';

import Modifier from 'ember-modifier';

import { VertexPlaygroundDemo } from './vertex-playground-demo';

import type ApplicationInstance from '@ember/application/instance';
import type { ArgsFor } from 'ember-modifier';

interface Args {
  Args: {
    Positional: [numberOfEdges: number];
  };
}

export class EntityTypesModifier extends Modifier<Args> {
  args: ArgsFor<Args>;
  lineDemo: VertexPlaygroundDemo;

  constructor(owner: ApplicationInstance, args: ArgsFor<Args>) {
    super(owner, args);
    registerDestructor(this, () => this.dispose());
    this.lineDemo = new VertexPlaygroundDemo();
    this.args = args;
  }

  async modify(element: HTMLElement) {
    this.lineDemo.init(element);
  }

  dispose() {
    this.lineDemo.dispose();
  }
}
