import { RequestAnimationFrame , ThreeJSView } from '@crowdstrike/graphics-core';

import { EmberComponentInterface } from './ember-component-interface';

import type { EmberComponentInterfaceParams } from './ember-component-interface';

const DISPOSED_OBJECT = undefined as never;

export abstract class ThreeJsComponentInterface<
  TData = unknown,
> extends EmberComponentInterface<TData> {
  raf?: RequestAnimationFrame;
  threeView: ThreeJSView;

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);
    this.raf = new RequestAnimationFrame(this.render, this);
    this.threeView = new ThreeJSView(settings.threeJSParams || {});
  }

  setSize(width: number, height: number) {
    if (this.threeView) {
      this.threeView.setSize(width, height);
    }
  }

  startRender() {
    this.raf?.start();
  }

  stopRender() {
    this.raf?.stop();
  }

  render(dt?: number): void {
    this.threeView?.render(dt);
  }

  get canvas() {
    return this.threeView?.canvas;
  }

  onSaveScreenshot(filename: string) {
    this.threeView.render();

    let dlLink = document.createElement('a');

    dlLink.download = filename;
    dlLink.href = this.threeView.canvas.toDataURL('image/png');
    dlLink.click();
  }

  dispose() {
    super.dispose();

    if (this.raf) {
      this.raf.stop();
      this.raf.dispose();
    }

    this.raf = undefined;

    if (this.threeView) {
      this.threeView.dispose();
    }

    this.threeView = DISPOSED_OBJECT;
  }

  setViewState(state: EntityDisplayState): void {
    state;
  }
}

export interface EntityStateProps {
  isLabelVisible: boolean;
}

export interface EntityDisplayState {
  edgeState?: Partial<EntityStateProps>;
  vertexState?: Partial<EntityStateProps>;
}
