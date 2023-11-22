import { registerDestructor } from '@ember/destroyable';

import Modifier from 'ember-modifier';

import { LineTypesDemo as LineV2Demo } from './line-types-demo';

import type ApplicationInstance from '@ember/application/instance';
import type { ArgsFor } from 'ember-modifier';

interface Args {
  Args: {
    Positional: [numberOfEdges: number];
  };
}

export class EdgeTypesModifier extends Modifier<Args> {
  args: ArgsFor<Args>;
  lineDemo: LineV2Demo = new LineV2Demo();

  constructor(owner: ApplicationInstance, args: ArgsFor<Args>) {
    super(owner, args);
    registerDestructor(this, () => this.dispose());
    this.args = args;
  }

  async modify(element: HTMLElement) {
    let [count] = this.args.positional;

    this.lineDemo.init(element, {
      count,
    });
  }

  dispose() {
    this.lineDemo.dispose();
  }
}
