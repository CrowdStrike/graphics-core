// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { MousePickerEvents } from "../../events/MousePickerEvents";
import { EventDispatcher } from "../../graph-utils-v2/events/event-dispatcher";

import type { MousePicker } from "../../core/MousePicker";
import type { ThreeJSView } from "../../core/ThreeJSView";

interface Subscriber {
  startDragObject?(event: MousePickerEvents): void;
  stopDragObject?(event: MousePickerEvents): void;
  onDragObject?(event: MousePickerEvents): void;
  onRollOver?(event: MousePickerEvents): void;
  onRollOut?(event: MousePickerEvents): void;
  onStartDrag?(event: MousePickerEvents): void;
  onStopDrag?(event: MousePickerEvents): void;
  onCanvasMouseUp?(event: MousePickerEvents): void;
  onDoubleClick?(event: MousePickerEvents): void;
  onCanvasMouseDown?(event: MousePickerEvents): void;
  onMouseUp?(event: MousePickerEvents): void;
  onMouseDown?(event: MousePickerEvents): void;
  onMouseWheel?(event: MousePickerEvents): void;
  onCanvasMouseOut?(event: MousePickerEvents): void;
  onCanvasMouseOver?(event: MousePickerEvents): void;
}
interface MouseControllerParams {
  threeView: ThreeJSView;
  subscribers: Subscriber[];
}

const DISPOSED_OBJECT = undefined as never;

export class MouseController extends EventDispatcher {
  private _mousePicker: MousePicker;
  private _threeView: ThreeJSView;
  private _subscribers;

  private _onCanvasMouseOutDelegate?: (e: MousePickerEvents) => void;
  private _onCanvasMouseOverDelegate?: (e: MousePickerEvents) => void;

  constructor({ threeView, subscribers }: MouseControllerParams) {
    super();

    this._subscribers = subscribers;
    this._mousePicker = threeView.mousePicker;

    this._mousePicker.addEventListener(
      MousePickerEvents.MOUSE_UP,
      this._onMouseUp,
      this,
    );
    this._mousePicker.addEventListener(
      MousePickerEvents.MOUSE_DOWN,
      this._onMouseDown,
      this,
    );
    this._mousePicker.addEventListener(
      MousePickerEvents.MOUSE_WHEEL,
      this._onMouseWheel,
      this,
    );
    this._mousePicker.addEventListener(
      MousePickerEvents.ROLL_OUT,
      this._onRollOut,
      this,
    );
    this._mousePicker.addEventListener(
      MousePickerEvents.ROLL_OVER,
      this._onRollOver,
      this,
    );
    this._mousePicker.addEventListener(
      MousePickerEvents.CANVAS_MOUSE_UP,
      this._onCanvasMouseUp,
      this,
    );

    this._mousePicker.addEventListener(
      MousePickerEvents.DOUBLE_CLICK,
      this._onDoubleClick,
      this,
    );

    this._mousePicker.addEventListener(
      MousePickerEvents.CANVAS_MOUSE_DOWN,
      this._onCanvasMouseDown,
      this,
    );
    this._mousePicker.addEventListener(
      MousePickerEvents.START_DRAG,
      this._onStartDrag,
      this,
    );
    this._mousePicker.addEventListener(
      MousePickerEvents.STOP_DRAG,
      this._onStopDrag,
      this,
    );
    this._mousePicker.addEventListener(
      MousePickerEvents.STOP_DRAG_OBJECT,
      this._stopDragObject,
      this,
    );
    this._mousePicker.addEventListener(
      MousePickerEvents.START_DRAG_OBJECT,
      this._startDragObject,
      this,
    );
    this._mousePicker.addEventListener(
      MousePickerEvents.DRAG_OBJECT,
      this._onDragObject,
      this,
    );

    this._mousePicker.linePrecision = 4;
    this._onCanvasMouseOutDelegate = (e: MousePickerEvents) =>
      this._onCanvasMouseOut(e);
    this._onCanvasMouseOverDelegate = (e: MousePickerEvents) =>
      this._onCanvasMouseOver(e);
    this._threeView = threeView;
    this._threeView.canvas.addEventListener(
      "mouseout",
      () => this._onCanvasMouseOutDelegate,
    );
    this._threeView.canvas.addEventListener(
      "mouseover",
      () => this._onCanvasMouseOverDelegate,
    );
  }

  dispose() {
    for (let i = 0; i < this._subscribers.length; i++) {
      this._subscribers[i] = DISPOSED_OBJECT;
    }

    if (this._mousePicker) {
      this._mousePicker.removeEventListener(
        MousePickerEvents.STOP_DRAG_OBJECT,
        this._stopDragObject,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.START_DRAG_OBJECT,
        this._startDragObject,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.DRAG_OBJECT,
        this._onDragObject,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.DOUBLE_CLICK,
        this._onDoubleClick,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.MOUSE_UP,
        this._onMouseUp,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.MOUSE_DOWN,
        this._onMouseDown,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.ROLL_OUT,
        this._onRollOut,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.ROLL_OVER,
        this._onRollOver,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.MOUSE_WHEEL,
        this._onMouseWheel,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.CANVAS_MOUSE_DOWN,
        this._onCanvasMouseDown,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.CANVAS_MOUSE_UP,
        this._onCanvasMouseUp,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.START_DRAG,
        this._onStartDrag,
        this,
      );
      this._mousePicker.removeEventListener(
        MousePickerEvents.STOP_DRAG,
        this._onStopDrag,
        this,
      );
    }

    this._threeView.canvas.removeEventListener(
      "mouseover",
      () => this._onCanvasMouseOverDelegate,
    );
    this._threeView.canvas.removeEventListener(
      "mouseout",
      () => this._onCanvasMouseOutDelegate,
    );

    this._mousePicker = DISPOSED_OBJECT;
    this._threeView = DISPOSED_OBJECT;
    this._onCanvasMouseOutDelegate = undefined;
    this._onCanvasMouseOverDelegate = undefined;

    super.dispose();
  }

  resize() {
    this._mousePicker?.resize();
  }

  private _startDragObject(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.startDragObject(event);
    });
  }

  private _stopDragObject(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.stopDragObject(event);
    });
  }

  private _onDragObject(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onDragObject(event);
    });
  }

  private _onRollOver(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onRollOver(event);
    });
  }

  private _onRollOut(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onRollOut(event);
    });
  }

  private _onStartDrag(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onCanvasMouseDown(event);
    });
  }

  private _onStopDrag(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onCanvasMouseUp(event);
    });
  }

  private _onCanvasMouseUp(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onCanvasMouseUp(event);
    });
  }

  private _onDoubleClick(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onDoubleClick(event);
    });
  }

  private _onCanvasMouseDown(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onCanvasMouseDown(event);
    });
  }

  private _onMouseUp(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onMouseUp(event);
    });
  }

  private _onMouseDown(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onMouseDown(event);
    });
  }

  private _onMouseWheel(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onMouseWheel(event);
    });
  }

  private _onCanvasMouseOut(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onCanvasMouseOut(event);
    });
  }

  private _onCanvasMouseOver(event: MousePickerEvents) {
    this._subscribers.forEach((subscriber) => {
      subscriber?.onCanvasMouseOver(event);
    });
  }
}
