import { registerDestructor } from '@ember/destroyable';

import { LineV2Demo } from '@crowdstrike/graphics-core';
import Modifier from 'ember-modifier';

import type ApplicationInstance from '@ember/application/instance';
import type { ArgsFor, PositionalArgs } from 'ember-modifier';

interface Args {
  Args: {
    Positional: [numberOfEdges: number];
  };
}

export class EdgeDemoModifier extends Modifier<Args> {
  lineDemo: LineV2Demo = new LineV2Demo();
  constructor(owner: ApplicationInstance, args: ArgsFor<Args>) {
    super(owner, args);
    registerDestructor(this, () => this.dispose());
  }

  async modify(element: HTMLElement, positional: PositionalArgs<Args>) {
    let [count] = positional;

    this.lineDemo.init(element, {
      count,
    });
  }

  dispose() {
    this.lineDemo.dispose();
  }
}
