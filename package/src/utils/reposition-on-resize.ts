import type { ThreeJSView } from '../core/ThreeJSView';

const DISPOSED_OBJECT = undefined as never;

export enum ResizeDirection {
  LEFT,
  RIGHT,
  TOP,
  BOTTOM,
  NONE,
}

export class RepositionOnResize {
  static direction: ResizeDirection = ResizeDirection.NONE;

  private width = 0;
  private height = 0;
  private threeView: ThreeJSView;

  constructor(threeView: ThreeJSView) {
    this.threeView = threeView;
  }

  init() {
    this.width = this.threeView.width;
    this.height = this.threeView.height;
  }

  setSize(width: number, height: number) {
    switch (RepositionOnResize.direction) {
      case ResizeDirection.LEFT:
        this.threeView.container.position.x += (width - this.width) / 2;
        this.threeView.container.position.y -= (height - this.height) / 2;

        break;

      case ResizeDirection.RIGHT:
        this.threeView.container.position.x -= (width - this.width) / 2;
        this.threeView.container.position.y -= (height - this.height) / 2;

        break;

      case ResizeDirection.BOTTOM:
        this.threeView.container.position.x -= (width - this.width) / 2;
        this.threeView.container.position.y += (height - this.height) / 2;

        break;
    }

    this.width = width;
    this.height = height;
  }

  dispose() {
    this.threeView = DISPOSED_OBJECT;
  }
}
