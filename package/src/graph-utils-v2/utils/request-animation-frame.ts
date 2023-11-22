export class RequestAnimationFrame {
  private _active = false;
  private _argsArray: unknown[];
  private _rafUpdateFunction: (dt?: number) => void;
  private _dt = 0;
  private _callback?: () => void;
  private _callbackContext: unknown = {};
  private _prevTime = 0;
  private _currentTime = 0;

  constructor(callback: (dt?: number) => void, callbackContext: unknown) {
    this._argsArray = [];
    this.setCallback(callback, callbackContext);

    this._rafUpdateFunction = () => {
      if (this._active) {
        this._tick();
      }
    };

    this._argsArray.push(this._dt);
  }

  setCallback(callback: (dt?: number) => void, callbackContext: unknown) {
    this._callback = callback;
    this._callbackContext = callbackContext;
  }

  start() {
    if (this._active) {
      return;
    }

    this._prevTime = Date.now();
    this._active = true;
    requestAnimationFrame(this._rafUpdateFunction);
  }

  dispose() {
    this.stop();
  }

  stop() {
    this._active = false;
  }

  get active() {
    return this._active;
  }

  _tick() {
    this._currentTime = Date.now();
    this._dt = this._currentTime - this._prevTime;
    this._argsArray[0] = this._dt;

    // spread operator shims are slower than apply.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this._callback?.apply(this._callbackContext, this._argsArray);
    requestAnimationFrame(this._rafUpdateFunction);
    this._prevTime = this._currentTime;
  }
}
