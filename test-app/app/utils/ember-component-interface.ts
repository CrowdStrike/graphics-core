import { tracked } from '@glimmer/tracking';

import { EventDispatcher } from '@crowdstrike/graphics-core';

import type { ThreeJSViewParams } from '@crowdstrike/graphics-core';

export interface EmberComponentInterfaceParams {
  rootURL: string;
  threeJSParams: ThreeJSViewParams;
}

const DISPOSED_OBJECT = undefined as never;

// eslint-disable-next-line @typescript-eslint/ban-types
type FunctionKeyof<T> = { [k in keyof T]: T[k] extends Function ? k : never }[keyof T];

export abstract class EmberComponentInterface<TData = unknown> extends EventDispatcher {
  @tracked data?: TData;
  isComponentReady = false;
  settings: EmberComponentInterfaceParams;
  height?: number;
  width?: number;

  constructor(settings: EmberComponentInterfaceParams) {
    super();
    this.settings = settings;
  }

  setData(data: TData) {
    this.data = data;
  }

  setSize(width: number, height: number): void {
    this.height = height;
    this.width = width;
  }

  abstract updateTheme(theme: string): void;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  startRender() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  stopRender() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  render(dt: number) {
    dt;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onComponentReady() {}

  runAction<T extends EmberComponentInterface>(actionName: FunctionKeyof<T>, ...rest: unknown[]) {
    let obj = this as unknown as T;
    let fnc = obj[actionName];

    if (typeof fnc === 'function') {
      fnc.apply(this, rest);
    }
  }

  dispose() {
    this.data = DISPOSED_OBJECT;
    this.settings = DISPOSED_OBJECT;
  }

  _onComponentReady() {
    this.isComponentReady = true;
    this.onComponentReady();
  }
}
