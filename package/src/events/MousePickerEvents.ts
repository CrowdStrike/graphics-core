import { Event } from "../graph-utils-v2/events/event";
import { Point } from "../utils/kurst/geom/Point";

import type { InstancedMeshWithController } from "../entities/instanced-attributes";

export class MousePickerEvents extends Event {
  static ROLL_OVER = "onRollOver";
  static ROLL_OUT = "onMouseOut";
  static MOUSE_UP = "onMouseUp";
  static MOUSE_DOWN = "onMouseDown";
  static RIGHT_CLICK = "onRightClick";
  static CANVAS_MOUSE_DOWN = "onCanvasMouseDown";
  static CANVAS_MOUSE_UP = "onCanvasMouseUp";
  static CANVAS_CLICK = "onCanvasClick";
  static START_DRAG = "onStartDrag";
  static STOP_DRAG = "onStopDrag";
  static START_DRAG_OBJECT = "onStartDragObject";
  static DRAG_OBJECT = "onDragObject";
  static STOP_DRAG_OBJECT = "onStopDragObject";
  static MOUSE_WHEEL = "onMouseWheel";
  static TOUCH_ZOOM = "onTouchZoom";
  static TAP_DRAG = "onTapDrag";
  static DOUBLE_CLICK = "onDoubleClick";

  instanceId: number | null = null;
  object: THREE.Object3D | InstancedMeshWithController | null = null; // THREE.Object3D
  data: unknown = null; // TODO: check this is not used
  mouse = new Point(); // Mouse location
  intersectionPoint: THREE.Vector3 | null = null; // THREE.Vector3 location of intersection in 3D space
  event?: MouseEvent; // original mouse event from JavaScript
  which: unknown = null; // which button
  isTouchEvent = false;
  startDistance: number | null = null; // number - distance between two touch points at start of pinch
  currentDistance: number | null = null; // number - current distance between two touch points
  touchDiffDistance: number | null = null; // difference change between start and current touch point
  x = -1;
  y = -1;

  constructor(type: string) {
    super(type);

    this.object = null; // THREE.Object3D
    this.data = null; // TODO: check this is not used
    this.mouse = new Point(); // Mouse location
    this.intersectionPoint = null; // THREE.Vector3 location of intersection in 3D space
    this.event = undefined; // original mouse event from JavaScript
    this.which = null; // which button
    this.isTouchEvent = false;
    this.startDistance = null; // number - distance between two touch points at start of pinch
    this.currentDistance = null; // number - current distance between two touch points
    this.touchDiffDistance = null; // difference change between start and current touch point
  }

  clone() {
    let e = new MousePickerEvents(this.type);

    e.instanceId = this.instanceId;
    e.object = this.object;
    e.data = this.data;
    e.mouse = this.mouse;
    e.intersectionPoint = this.intersectionPoint;
    e.event = this.event;
    e.which = this.which;
    e.isTouchEvent = this.isTouchEvent;
    e.startDistance = this.startDistance;
    e.currentDistance = this.currentDistance;
    e.touchDiffDistance = this.touchDiffDistance;

    return e;
  }

  reset() {
    this.instanceId = null;
    this.object = null;
    this.data = null;
    this.mouse = new Point();
    this.intersectionPoint = null;
    this.event = undefined;
    this.which = null;
    this.isTouchEvent = false;
    this.startDistance = null;
    this.currentDistance = null;
    this.touchDiffDistance = null;

    super.reset();
  }
}
