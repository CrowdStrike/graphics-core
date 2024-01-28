import { EventDispatcher } from '../../graph-utils-v2/events/event-dispatcher';

import type { ThreeJSView } from '../../core/ThreeJSView';

interface RenderableObjectParams {
  threeView: ThreeJSView;
}

const DISPOSED_OBJECT = undefined as never;

export class RenderableObject extends EventDispatcher {
  threeView: ThreeJSView;
  private _isActive = false;

  private declare _currentState?: boolean;
  private declare _previousState?: boolean;
  private declare _w?: number;
  private declare _h?: number;

  constructor({ threeView }: RenderableObjectParams) {
    super();
    this.threeView = threeView;
  }

  // Public

  dispose() {
    super.dispose();
    this.threeView = DISPOSED_OBJECT;
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  render(_dt: number) {}

  setSize(w: number, h: number) {
    this._w = w;
    this._h = h;
  }

  didToggleActiveState(currentState: boolean, previousState: boolean) {
    this._previousState = previousState;
    this._currentState = currentState;
  }

  get isActive() {
    return this._isActive;
  }

  set isActive(bool) {
    let previousState = this._isActive;

    this._isActive = bool;

    if (previousState !== this._isActive) {
      this.didToggleActiveState(this.isActive, previousState);
    }
  }
}
