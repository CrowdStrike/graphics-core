import * as THREE from "three";

import { InstancedMeshWithController } from "../entities/instanced-attributes";
import { MousePickerEvents } from "../events/MousePickerEvents";
import { EventDispatcher } from "../graph-utils-v2/events/event-dispatcher";
import { ThreeGeomUtils } from "../utils/kurst/utils/ThreeGeomUtils";

import type { ThreeJSView } from "./ThreeJSView";

const OBJECT_MIN_DRAG_DISTANCE = 3;

type PickingPlane = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
interface MouseEventCallback {
  (e: MouseEvent): void;
}
interface TouchEventCallback {
  (e: TouchEvent): void;
}

type PinchPoints = [THREE.Vector2, THREE.Vector2];

type SupportedIntersectedMesh =
  | THREE.Object3D<Event>
  | THREE.InstancedMesh
  | InstancedMeshWithController;

export class MousePicker extends EventDispatcher {
  static TOUCH_DRAG_STATE = 0;
  static TOUCH_ZOOM_STATE = 5;

  private _canvasClick: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.CANVAS_CLICK
  );
  private _canvasDown: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.CANVAS_MOUSE_DOWN
  );

  private _canvasUp: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.CANVAS_MOUSE_UP
  );
  _doubleClick: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.DOUBLE_CLICK
  );
  private _mouseDown: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.MOUSE_DOWN
  );
  private _mouseUp: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.MOUSE_UP
  );
  private _mouseWheel: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.MOUSE_WHEEL
  );
  private _rightClickEvent: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.RIGHT_CLICK
  );

  private _rollOutEvent: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.ROLL_OUT
  );
  private _rollOverEvent: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.ROLL_OVER
  );
  private _startDrag: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.START_DRAG
  );
  private _stopDrag: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.STOP_DRAG
  );
  private _tapDrag: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.TAP_DRAG
  );
  private _touchZoom: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.TOUCH_ZOOM
  );
  _startDragObject: MousePickerEvents & { x?: number; y?: number } =
    new MousePickerEvents(MousePickerEvents.START_DRAG_OBJECT);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  _stopDragObject: MousePickerEvents & { x: number; y: number } =
    new MousePickerEvents(MousePickerEvents.STOP_DRAG_OBJECT);

  _dragObject: MousePickerEvents = new MousePickerEvents(
    MousePickerEvents.DRAG_OBJECT
  );

  // private:delegates (note this is optimised for performance) - delegates are faster than apply / bind
  private _lastMouseDownEvent?: MouseEvent | TouchEvent;
  private _mouseDownDelegate: MouseEventCallback;
  private _mouseMoveDelegate: MouseEventCallback;
  private _mouseOutDelegate: MouseEventCallback;
  private _mouseOverDelegate: MouseEventCallback;
  private _mouseWheelDelegate: MouseEventCallback;
  private _rightClickDelegate: MouseEventCallback;
  private _touchEndDelegate: TouchEventCallback;
  private _touchMoveDelegate: TouchEventCallback;
  private _touchStartDelegate: TouchEventCallback;
  private _mouseUpDelegate: MouseEventCallback;
  private _windowMouseUpDelegate: MouseEventCallback;
  private _clientRect: DOMRect;
  private _doubleTapIID: ReturnType<typeof setTimeout> | null = null;
  private _doubleTapPreviousObject: SupportedIntersectedMesh | null = null;
  private _dragActive = false;
  private _hasDoubleClickDelayExpired = false;
  private _intersects: THREE.Intersection<SupportedIntersectedMesh>[] = [];
  private _intersectsBG: THREE.Intersection<THREE.Object3D<Event>>[] = [];
  private _isCanvasClickAction = false;
  private _isMouseDownOnCanvas = false;
  private _isPinchActionStarted = false;
  private _isDraggingObject = false;
  private _isTapDragActionDelayEnabled = false;
  private _isTouchEnabled = false;
  private _isTouchMouseMove = false;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  private _lastCanvasMouseDownPoint: THREE.Vector2 & {
    intersectionPoint: THREE.Vector3;
  } = new THREE.Vector2();

  private _mousePercentFromCenter = new THREE.Vector2(-1, -1); // initial values -1 otherwise we get intersections by default in the center of the scene
  private _pinchPointDictionaryByID: Record<number, THREE.Vector2> = {};
  private _pinchPoints: [THREE.Vector2, THREE.Vector2] = [
    new THREE.Vector2(),
    new THREE.Vector2(),
  ];
  private _pinchStartPointDictionaryByID: Record<string, THREE.Vector2> = {};
  private _startDragObjectPosition = new THREE.Vector2();
  private _pinchStartPoints: PinchPoints = [
    new THREE.Vector2(),
    new THREE.Vector2(),
  ];
  private _raycaster: THREE.Raycaster = new THREE.Raycaster();
  private _tapAndDragIID: ReturnType<typeof setInterval> | null = null;
  private _threeView: ThreeJSView;
  private _touchState: number | null = null;
  private _pickingPlane: PickingPlane;
  private _pickingPlaneArray: PickingPlane[] = [];
  private _previousDistance = 0;

  currentIntersectedInstanceId: number | null = null;
  currentIntersected: SupportedIntersectedMesh | null = null;
  doubleTapEnabledDelay = 300;
  dragTolerance = 0.002;
  intersectionPoint = new THREE.Vector3();
  isEnabled = true;
  mouse = new THREE.Vector2(-1, -1); // initial values -1 otherwise we get intersections by default in the center of the scene

  constructor({ threeView }: { threeView: ThreeJSView }) {
    super();
    this._mouseDownDelegate = (e) => this._onMouseDown(e);
    this._mouseMoveDelegate = (e) => this._onMouseMove(e);
    this._mouseOutDelegate = () => this._onMouseOut();
    this._mouseOverDelegate = () => this._onMouseOver();
    this._mouseWheelDelegate = (e) => this._onMouseWheel(e); // Throttled to only dispatch 1 event every 60 frames
    this._rightClickDelegate = (e) => this._onMouseRightClick(e);
    this._touchEndDelegate = (e) => this._onTouchEnd(e);
    this._touchMoveDelegate = (e) => this._onTouchMove(e);
    this._touchStartDelegate = (e) => this._onTouchStart(e);
    this._mouseUpDelegate = (e) => this._onMouseUp(e);
    this._windowMouseUpDelegate = (e) => this._onWindowMouseUp(e);
    this._threeView = threeView;

    // private
    this._pickingPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600, 1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    );
    this._pickingPlane.matrixAutoUpdate = true;
    this._pickingPlaneArray = [this._pickingPlane];

    if (this._raycaster?.params.Line) {
      this._raycaster.params.Line.threshold = 1;
    }

    // public
    this._initMouseHandlers();

    this._clientRect = this._threeView.canvas.getBoundingClientRect();
  }

  disposeMouseHandlers() {
    this._disposeMouseHandlers();
  }

  updateCanvas() {
    this.disposeMouseHandlers();
    this._initMouseHandlers();
  }

  resize() {
    this._clientRect = this._threeView.canvas.getBoundingClientRect();
  }

  dispose() {
    this._threeView.canvas.removeEventListener(
      "mouseover",
      this._mouseOverDelegate as MouseEventCallback
    );
    this._threeView.canvas.removeEventListener(
      "mouseout",
      this._mouseOutDelegate as MouseEventCallback
    );
    this._threeView.canvas.removeEventListener(
      "touchstart",
      this._touchStartDelegate as TouchEventCallback
    );
    this._threeView.canvas.removeEventListener(
      "touchend",
      this._touchEndDelegate as TouchEventCallback
    );
    this._threeView.canvas.removeEventListener(
      "touchmove",
      this._touchMoveDelegate as TouchEventCallback
    );
    this._threeView.canvas.removeEventListener(
      "mousedown",
      this._mouseDownDelegate as MouseEventCallback
    );
    this._threeView.canvas.removeEventListener(
      "contextmenu",
      this._rightClickDelegate as MouseEventCallback
    );
    this._threeView.canvas.removeEventListener(
      "mousemove",
      this._mouseMoveDelegate as MouseEventCallback
    );
    this._threeView.canvas.removeEventListener(
      "wheel",
      this._mouseWheelDelegate as MouseEventCallback
    );

    window.removeEventListener(
      "mouseup",
      this._windowMouseUpDelegate as MouseEventCallback
    );

    this._startDragObject.reset();
    this._stopDragObject.reset();
    this._dragObject.reset();

    this._pickingPlane?.geometry.dispose();
    this._pickingPlane?.material.dispose();
    this._pickingPlane = null as never;
    this._pickingPlaneArray = null as never;
    this._rollOutEvent.reset();
    this._rollOverEvent.reset();
    this._mouseUp.reset();
    this._mouseDown.reset();
    this._rightClickEvent.reset();
    this._canvasDown.reset();
    this._canvasUp.reset();
    this._startDrag.reset();
    this._stopDrag.reset();
    this._canvasClick.reset();
    this._mouseWheel.reset();
    this._touchZoom.reset();
    this._tapDrag.reset();
    this._doubleClick.reset();
    this._rollOutEvent = null as never;
    this._rollOverEvent = null as never;
    this._mouseUp = null as never;
    this._mouseDown = null as never;
    this._rightClickEvent = null as never;
    this._canvasDown = null as never;
    this._canvasUp = null as never;
    this._startDrag = null as never;
    this._stopDrag = null as never;
    this._canvasClick = null as never;
    this._mouseWheel = null as never;
    this._touchZoom = null as never;
    this._tapDrag = null as never;
    this._doubleClick = null as never;
    this._mouseOverDelegate = null as never;
    this._mouseOutDelegate = null as never;
    this._touchStartDelegate = null as never;
    this._touchEndDelegate = null as never;
    this._touchMoveDelegate = null as never;
    this._mouseDownDelegate = null as never;
    this._rightClickDelegate = null as never;
    this._mouseUpDelegate = null as never;
    this._windowMouseUpDelegate = null as never;
    this._mouseMoveDelegate = null as never;
    this._mouseWheelDelegate = null as never;
    this._pinchStartPoints = null as never;
    this._pinchPoints = null as never;
    this._pinchStartPointDictionaryByID = null as never;
    this._pinchPointDictionaryByID = null as never;
    this._isPinchActionStarted = null as never;
    this._isTouchMouseMove = null as never;
    this._isTouchEnabled = null as never;
    this._touchState = null as never;
    this._threeView = null as never;
    this._raycaster = null as never;
    this._mousePercentFromCenter = null as never;
    this._lastCanvasMouseDownPoint = null as never;
    this._isCanvasClickAction = null as never;
    this._dragActive = null as never;
    this._intersects = null as never;
    this._isMouseDownOnCanvas = null as never;
    this._isTapDragActionDelayEnabled = null as never;
    this._hasDoubleClickDelayExpired = null as never;
    this._doubleTapPreviousObject = null as never;
    this._tapAndDragIID = null as never;
    this._doubleTapIID = null as never;
    this._clientRect = null as never;
    this._intersectsBG = null as never;
    this.intersectionPoint = null as never;
    this.currentIntersected = null as never;
    this.currentIntersectedInstanceId = null as never;
    this.dragTolerance = null as never;
    this.mouse = null as never;
    super.dispose();
  }

  /**
   * render loop - run the mouse pick logic
   */
  render() {
    if (!this.isEnabled || !this._threeView.camera) {
      return;
    }

    // if the mouse is down on the canvas - check if we need to start tracking a drag event ( and start the event )
    if (this._isCanvasClickAction) {
      let distanceFromCenter = this._lastCanvasMouseDownPoint.distanceTo(
        this._mousePercentFromCenter
      );

      if (distanceFromCenter > this.dragTolerance && !this._dragActive) {
        this._startDrag.mouse.x = this.mouse.x;
        this._startDrag.mouse.y = this.mouse.y;
        this._startDrag.isTouchEvent = this._isTouchMouseMove;
        this._startDrag.intersectionPoint = this.intersectionPoint;
        this._startDrag.event = this._lastMouseDownEvent as
          | MouseEvent
          | undefined;
        this.dispatchEvent(this._startDrag);
        this._dragActive = true;
      }
    }

    this._raycaster.setFromCamera(
      this._mousePercentFromCenter,
      this._threeView.camera
    );
    this._intersects = this._raycaster.intersectObjects(
      this._threeView.container.children,
      true
    );
    this._intersectsBG = this._raycaster.intersectObjects(
      this._pickingPlaneArray,
      false
    );

    if (this._intersectsBG.length > 0) {
      this.intersectionPoint = this._intersectsBG[0].point;
    }

    let mousePosition = this._threeView.project(this.mouse);

    this._pickingPlane.position.set(
      mousePosition.x,
      mousePosition.y,
      mousePosition.z
    );
    this._pickingPlane.updateMatrixWorld();

    // filter out instanced meshes that don't receive mouse events
    this._intersects = this._intersects.filter((i) => {
      if (!(i.object instanceof InstancedMeshWithController)) return true;

      let isVisible = true;

      // needs to be undefined - instanceId can be 0
      if (i.instanceId !== undefined) {
        isVisible = i.object.attributesController?.getVisibilityAt(
          i.instanceId
        );
      }

      let dispatchesMouseEvents =
        i.object.attributesController.shouldDispatchMouseEvents === true;

      return isVisible && dispatchesMouseEvents;
    });

    // Detect & dispatch roll over / roll out events on 3D objects using raycast info
    if (this._intersects.length > 0) {
      let isDifferentObjectIntersected =
        this._intersects[0].object !== this.currentIntersected;

      if (isDifferentObjectIntersected && this.currentIntersected !== null) {
        // Roll out currently selected
        this._rollOutEvent.object = this.currentIntersected;
        this._rollOutEvent.instanceId = this.currentIntersectedInstanceId;
        this._rollOutEvent.intersectionPoint = this.intersectionPoint;
        this._rollOutEvent.isTouchEvent = this._isTouchEnabled;
        this.dispatchEvent(this._rollOutEvent);
        this.currentIntersected = null;
        this.currentIntersectedInstanceId = null;
      }

      // Roll over new selected object
      if (this._intersects[0].object !== this.currentIntersected) {
        this.currentIntersected = this._intersects[0].object;
        this.currentIntersectedInstanceId =
          this._intersects[0]?.instanceId ?? null;

        this._rollOverEvent.object = this.currentIntersected;
        this._rollOverEvent.instanceId = this.currentIntersectedInstanceId;
        this._rollOverEvent.intersectionPoint = this.intersectionPoint;
        this._rollOverEvent.isTouchEvent = this._isTouchEnabled;
        this.dispatchEvent(this._rollOverEvent);
      }
    } else {
      // Roll out currently selected
      if (this.currentIntersected) {
        this._rollOutEvent.object = this.currentIntersected;
        this._rollOutEvent.instanceId = this.currentIntersectedInstanceId;
        this._rollOutEvent.intersectionPoint = this.intersectionPoint;
        this._rollOutEvent.isTouchEvent = this._isTouchEnabled;
        this.dispatchEvent(this._rollOutEvent);
        this.currentIntersected = null;
        this.currentIntersectedInstanceId = null;
      }
    }

    if (
      !this._isCanvasClickAction &&
      this._isMouseDownOnCanvas &&
      !this._isDraggingObject
    ) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      let distanceFromMouseDown = this.mouse.distanceTo(this._mouseDown.mouse);

      if (distanceFromMouseDown > OBJECT_MIN_DRAG_DISTANCE) {
        this._isDraggingObject = true;

        this._startDragObject.object = this.currentIntersected;
        this._startDragObject.instanceId = this.currentIntersectedInstanceId;
        this._startDragObject.intersectionPoint = this.intersectionPoint;
        this._startDragObject.mouse.x = this.mouse.x;
        this._startDragObject.mouse.y = this.mouse.y;
        this._startDragObjectPosition.x = this.mouse.x;
        this._startDragObjectPosition.y = this.mouse.y;
        this.dispatchEvent(this._startDragObject);
      }
    }

    if (this._isDraggingObject) {
      this._dragObject.object = this.currentIntersected;
      this._dragObject.instanceId = this.currentIntersectedInstanceId;
      this._dragObject.intersectionPoint = this.intersectionPoint;
      this._dragObject.mouse.x = this.mouse.x;
      this._dragObject.mouse.y = this.mouse.y;
      this.dispatchEvent(this._dragObject);
    }
  }

  enableMouse(flag: boolean) {
    this.isEnabled = flag;
    this._disposeMouseHandlers();

    if (flag) {
      this._initMouseHandlers();
    }
  }

  /**
   * @private
   */
  private _initMouseHandlers() {
    this._threeView.canvas.addEventListener(
      "mouseover",
      this._mouseOverDelegate
    );
    this._threeView.canvas.addEventListener("mouseout", this._mouseOutDelegate);
    this._threeView.canvas.addEventListener(
      "touchstart",
      this._touchStartDelegate
    );
    this._threeView.canvas.addEventListener("touchend", this._touchEndDelegate);
    this._threeView.canvas.addEventListener(
      "touchmove",
      this._touchMoveDelegate
    );
    this._threeView.canvas.addEventListener(
      "mousedown",
      this._mouseDownDelegate
    );
    this._threeView.canvas.addEventListener(
      "contextmenu",
      this._rightClickDelegate
    );
    this._threeView.canvas.addEventListener("mouseup", this._mouseUpDelegate);
    window.addEventListener("mouseup", this._windowMouseUpDelegate);
  }

  _disposeMouseHandlers() {
    this._threeView.canvas.removeEventListener(
      "mouseover",
      this._mouseOverDelegate
    );
    this._threeView.canvas.removeEventListener(
      "mouseout",
      this._mouseOutDelegate
    );
    this._threeView.canvas.removeEventListener(
      "touchstart",
      this._touchStartDelegate
    );
    this._threeView.canvas.removeEventListener(
      "touchend",
      this._touchEndDelegate
    );
    this._threeView.canvas.removeEventListener(
      "touchmove",
      this._touchMoveDelegate
    );
    this._threeView.canvas.removeEventListener(
      "mousedown",
      this._mouseDownDelegate
    );
    this._threeView.canvas.removeEventListener(
      "contextmenu",
      this._rightClickDelegate
    );
    this._threeView.canvas.removeEventListener(
      "mouseup",
      this._mouseUpDelegate
    );
    window.removeEventListener("mouseup", this._windowMouseUpDelegate);
  }

  _onTouchStart(e: TouchEvent) {
    e.preventDefault();

    if (e.targetTouches.length === 1) {
      this._isTouchEnabled = true;
      this._touchState = MousePicker.TOUCH_DRAG_STATE;
      this.mouse.x = this._getTouchEventXOffset(e.touches[0]);
      this.mouse.y = this._getTouchEventYOffset(e.touches[0]);
      this._updateMousePercentFromCenter();
      this.render();
      this._onMouseDown(e);
      this._detectAndDispatchTapDrag(e);
    } else if (e.targetTouches.length === 2) {
      if (this._tapAndDragIID) {
        clearTimeout(this._tapAndDragIID);
      }

      this._isTouchEnabled = true;
      this._isTapDragActionDelayEnabled = false;
      this._pinchStartPointDictionaryByID = {};
      this._pinchPointDictionaryByID = {};

      let touchEvent;

      for (let c = 0; c < e.targetTouches.length; c++) {
        touchEvent = e.targetTouches[c];
        this._pinchStartPoints[c].x = this._getTouchEventXOffset(touchEvent);
        this._pinchStartPoints[c].y = this._getTouchEventYOffset(touchEvent);
        this._pinchPoints[c].x = this._pinchStartPoints[c].x;
        this._pinchPoints[c].y = this._pinchStartPoints[c].y;
        this._pinchStartPointDictionaryByID[touchEvent.identifier] =
          this._pinchStartPoints[c];
        this._pinchPointDictionaryByID[touchEvent.identifier] =
          this._pinchPoints[c];
      }

      this._touchState = MousePicker.TOUCH_ZOOM_STATE;
      this._previousDistance = 0;
      this._isPinchActionStarted = false;
    }
  }

  _onTouchEnd(e: TouchEvent) {
    this._onMouseUp(e as unknown as MouseEvent);
    this._touchState = null;
    this._isTouchEnabled = false;
  }

  _onTouchMove(e: TouchEvent) {
    switch (this._touchState) {
      case MousePicker.TOUCH_DRAG_STATE:
        if (e.targetTouches.length === 1 && e.changedTouches.length === 1) {
          this.mouse.x = this._getTouchEventXOffset(e.touches[0]);
          this.mouse.y = this._getTouchEventYOffset(e.touches[0]);
          this._updateMousePercentFromCenter();
          this._isTouchMouseMove = true;
        }

        break;

      case MousePicker.TOUCH_ZOOM_STATE:
        if (e.targetTouches.length === 2) {
          if (this._isPinchActionStarted) {
            let touchEvent;
            let startPinchPoint;
            let touchMatchFound = true;
            let pinchPoint;

            for (let c = 0; c < e.changedTouches.length; c++) {
              touchEvent = e.changedTouches[c];
              startPinchPoint = this._getStartPinchByID(touchEvent.identifier);
              pinchPoint = this._getPinchByID(touchEvent.identifier);

              if (startPinchPoint === null) {
                touchMatchFound = false;
              }

              if (pinchPoint !== null && touchMatchFound === true) {
                pinchPoint.x = this._getTouchEventXOffset(touchEvent);
                pinchPoint.y = this._getTouchEventYOffset(touchEvent);
              } else {
                touchMatchFound = false;
              }
            }

            if (touchMatchFound) {
              this._touchZoom.startDistance =
                this._pinchStartPoints[0].distanceTo(this._pinchStartPoints[1]);
              this._touchZoom.currentDistance = this._pinchPoints[0].distanceTo(
                this._pinchPoints[1]
              );
              this._touchZoom.touchDiffDistance =
                this._touchZoom.currentDistance - this._previousDistance;
              this._setCenterOfPinchEvent(
                this._pinchPoints[0],
                this._pinchPoints[1]
              );
              this.dispatchEvent(this._touchZoom);
              this._previousDistance = this._touchZoom.currentDistance;
            }
          } else {
            this._setCenterOfPinchEvent(
              this._pinchPoints[0],
              this._pinchPoints[1]
            );
            this._touchZoom.currentDistance = this._pinchPoints[0].distanceTo(
              this._pinchPoints[1]
            );
            this._previousDistance = this._touchZoom.currentDistance;
            this._isPinchActionStarted = true;
          }
        }

        break;
    }
  }

  _onWindowMouseUp(e: MouseEvent) {
    this._maybeStopObjectDrag();

    if (this._dragActive) {
      this._stopDrag.event = e;
      this._stopDrag.mouse.x = this.mouse.x;
      this._stopDrag.mouse.y = this.mouse.y;
      this._stopDrag.which = e.which;
      this._stopDrag.intersectionPoint = this.intersectionPoint;
      this._stopDrag.isTouchEvent = this._isTouchEnabled;
      this.dispatchEvent(this._stopDrag);
      this._dragActive = false;
      this._isMouseDownOnCanvas = false;
      this._isCanvasClickAction = false;
    }
  }

  _maybeStopObjectDrag() {
    if (this._isDraggingObject) {
      this._isDraggingObject = false;
      this._stopDragObject.object = this.currentIntersected;
      this._stopDragObject.x = this.mouse.x;
      this._stopDragObject.y = this.mouse.y;
      this._isMouseDownOnCanvas = false;
      this.dispatchEvent(this._stopDragObject);
    }
  }

  _onMouseUp(e: MouseEvent) {
    this._maybeStopObjectDrag();

    if (!this._isMouseDownOnCanvas) {
      return;
    }

    this._isDraggingObject = false;

    if (this._isCanvasClickAction) {
      // Stop a drag if there is an active drag
      if (this._dragActive) {
        this._stopDrag.event = e;
        this._stopDrag.mouse.x = this.mouse.x;
        this._stopDrag.mouse.y = this.mouse.y;
        this._stopDrag.which = e.which;
        this._stopDrag.intersectionPoint = this.intersectionPoint;
        this._stopDrag.isTouchEvent = this._isTouchEnabled;
        this.dispatchEvent(this._stopDrag);
        this._dragActive = false;
      } else {
        // Canvas click
        this._canvasClick.event = e;
        this._canvasClick.mouse.x = this.mouse.x;
        this._canvasClick.mouse.y = this.mouse.y;
        this._canvasClick.which = e.which;
        this._canvasClick.intersectionPoint = this.intersectionPoint;
        this._canvasClick.isTouchEvent = this._isTouchEnabled;
        this.dispatchEvent(this._canvasClick);
      }

      // Canvas mouse Up event
      this._isCanvasClickAction = false;
      this._canvasUp.event = e;
      this._canvasUp.mouse.x = this.mouse.x;
      this._canvasUp.mouse.y = this.mouse.y;
      this._canvasUp.which = e.which;
      this._canvasUp.intersectionPoint = this.intersectionPoint;
      this._canvasUp.isTouchEvent = this._isTouchEnabled;
      this.dispatchEvent(this._canvasUp);
    } else if (this.currentIntersected) {
      // Double Tap / Click
      if (this._hasDoubleClickDelayExpired === false) {
        this._doubleTapPreviousObject = this.currentIntersected;
        this._startDoubleTapDelay();
      } else if (this._hasDoubleClickDelayExpired === true) {
        if (this._doubleTapPreviousObject === this.currentIntersected) {
          this._doubleClick.event = e;
          this._doubleClick.mouse.x = this.mouse.x;
          this._doubleClick.mouse.y = this.mouse.y;
          this._doubleClick.object = this.currentIntersected;
          this._doubleClick.instanceId = this.currentIntersectedInstanceId;
          this._doubleClick.which = e.which;
          this._doubleClick.intersectionPoint = this.intersectionPoint;
          this._doubleClick.isTouchEvent = this._isTouchEnabled;
          this.dispatchEvent(this._doubleClick);
          this._doubleTapPreviousObject = null;
        }
      }

      // Mouse Up
      this._mouseUp.event = e;
      this._mouseUp.mouse.x = this.mouse.x;
      this._mouseUp.mouse.y = this.mouse.y;
      this._mouseUp.object = this.currentIntersected;
      this._mouseUp.instanceId = this.currentIntersectedInstanceId;
      this._mouseUp.which = e.which;
      this._mouseUp.intersectionPoint = this.intersectionPoint;
      this._mouseUp.isTouchEvent = this._isTouchEnabled;
      this.dispatchEvent(this._mouseUp);
    }

    this._isMouseDownOnCanvas = false;

    e.preventDefault();
  }

  _onMouseDown(e: MouseEvent | TouchEvent) {
    this._isMouseDownOnCanvas = true;
    this._isDraggingObject = false;

    let isTouchEvent = window.TouchEvent && e instanceof window.TouchEvent;

    if (this.currentIntersected) {
      // if we have an intersection

      this._mouseDown.object = this.currentIntersected;
      this._mouseDown.instanceId = this.currentIntersectedInstanceId;
      this._mouseDown.mouse.x = isTouchEvent
        ? this._getTouchEventXOffset((e as unknown as TouchEvent).touches[0])
        : this.mouse.x;
      this._mouseDown.mouse.y = isTouchEvent
        ? this._getTouchEventYOffset((e as unknown as TouchEvent).touches[0])
        : this.mouse.y;
      this._mouseDown.which = e.which;
      this._mouseDown.event = e as MouseEvent;
      this._mouseDown.intersectionPoint = this.intersectionPoint;
      this._mouseDown.isTouchEvent = this._isTouchEnabled;
      this.dispatchEvent(this._mouseDown);
    } else {
      // if we have no intersection - this is a canvas click
      this._isCanvasClickAction = true;
      this._canvasDown.event = e as MouseEvent;
      this._mouseDown.mouse.x = isTouchEvent
        ? this._getTouchEventXOffset((e as unknown as TouchEvent).touches[0])
        : this.mouse.x;
      this._mouseDown.mouse.y = isTouchEvent
        ? this._getTouchEventYOffset((e as unknown as TouchEvent).touches[0])
        : this.mouse.y;
      this._canvasDown.which = e.which;
      this._lastCanvasMouseDownPoint.x = this._mousePercentFromCenter.x;
      this._lastCanvasMouseDownPoint.y = this._mousePercentFromCenter.y;
      this._lastCanvasMouseDownPoint.intersectionPoint = this.intersectionPoint;
      this._canvasDown.intersectionPoint = this.intersectionPoint;
      this._canvasDown.isTouchEvent = this._isTouchEnabled;
      this.dispatchEvent(this._canvasDown);
    }

    e.preventDefault();

    this._lastMouseDownEvent = e;
  }

  _onMouseRightClick(e: MouseEvent) {
    if (this.currentIntersected) {
      this._rightClickEvent.object = this.currentIntersected;
      this._rightClickEvent.instanceId = this.currentIntersectedInstanceId;
      this._rightClickEvent.mouse.x = this.mouse.x;
      this._rightClickEvent.mouse.y = this.mouse.y;
      this._rightClickEvent.event = e;
      this._rightClickEvent.intersectionPoint = this.intersectionPoint;
      this.dispatchEvent(this._rightClickEvent);
    }

    e.preventDefault();

    return false;
  }

  _onMouseOut() {
    this._threeView.canvas.removeEventListener(
      "mousemove",
      this._mouseMoveDelegate
    );
    this._threeView.canvas.removeEventListener(
      "wheel",
      this._mouseWheelDelegate
    );
  }

  _onMouseOver() {
    this._threeView.canvas.addEventListener(
      "mousemove",
      this._mouseMoveDelegate
    );
    this._threeView.canvas.addEventListener("wheel", this._mouseWheelDelegate);
  }

  _onMouseWheel(e: MouseEvent) {
    this._mouseWheel.object = this.currentIntersected;
    this._mouseWheel.mouse.x = this.mouse.x;
    this._mouseWheel.mouse.y = this.mouse.y;
    this._mouseWheel.event = e;
    this._mouseWheel.intersectionPoint = this.intersectionPoint;
    this.dispatchEvent(this._mouseWheel);
  }

  _onMouseMove(e: MouseEvent) {
    this.mouse.x = e.clientX - this._clientRect.left;
    this.mouse.y = e.clientY - this._clientRect.top;
    this._updateMousePercentFromCenter();
    this._isTouchMouseMove = false;
  }

  _startDoubleTapDelay() {
    if (this._doubleTapIID) {
      clearTimeout(this._doubleTapIID);
    }

    this._doubleTapIID = setTimeout(
      () => this._startDoubleTapDelayComplete(),
      this.doubleTapEnabledDelay
    );
    this._hasDoubleClickDelayExpired = true;
  }

  _startDoubleTapDelayComplete() {
    this._doubleTapIID = null;
    this._hasDoubleClickDelayExpired = false;
  }

  _startTapAndDragDelay() {
    if (this._tapAndDragIID) {
      clearTimeout(this._tapAndDragIID);
    }

    this._tapAndDragIID = setTimeout(
      () => this._tapAndDragDelayComplete(),
      this.doubleTapEnabledDelay
    );
    this._isTapDragActionDelayEnabled = true;
  }

  _tapAndDragDelayComplete() {
    this._isTapDragActionDelayEnabled = false;
  }

  _detectAndDispatchTapDrag(e: TouchEvent) {
    // Tap Drag detection & handler
    if (this._isTapDragActionDelayEnabled === true) {
      if (this.currentIntersected === null) {
        this._tapDrag.event = e as unknown as MouseEvent;
        this._tapDrag.mouse.x = this.mouse.x;
        this._tapDrag.mouse.y = this.mouse.y;
        this._tapDrag.intersectionPoint = this.intersectionPoint;
        this._tapDrag.isTouchEvent = this._isTouchEnabled;
        this.dispatchEvent(this._tapDrag);
      }

      if (this._tapAndDragIID) {
        clearTimeout(this._tapAndDragIID);
      }

      this._isTapDragActionDelayEnabled = false;
    } else {
      this._startTapAndDragDelay();
    }
  }

  _getStartPinchByID(id: number) {
    if (this._pinchStartPointDictionaryByID[id] === undefined) {
      return null;
    }

    return this._pinchStartPointDictionaryByID[id];
  }

  _getPinchByID(id: number) {
    if (this._pinchPointDictionaryByID[id] === undefined) {
      return null;
    }

    return this._pinchPointDictionaryByID[id];
  }

  /**
   * Get corrected touch event X offset
   * @param e : TouchEvent
   * @return {number}
   */
  _getTouchEventXOffset(e: Touch) {
    return e.clientX - this._clientRect.left;
  }

  /**
   * Get corrected touch event U offset
   * @param e : TouchEvent
   * @return {number}
   */
  _getTouchEventYOffset(e: Touch) {
    return e.clientY - this._clientRect.top;
  }

  /**
   * @param startPoint : THREE.Vector2
   * @param endPoint : THREE.Vector2
   */
  _setCenterOfPinchEvent(startPoint: THREE.Vector2, endPoint: THREE.Vector2) {
    ThreeGeomUtils.pointInBetween2D(startPoint, endPoint, this.mouse, 0.5);
  }

  _updateMousePercentFromCenter() {
    this._mousePercentFromCenter.x =
      (this.mouse.x / this._clientRect.width) * 2 - 1;
    this._mousePercentFromCenter.y = -(
      (this.mouse.y / this._clientRect.height) * 2 -
      1
    );
  }

  get intersects() {
    return this._intersects;
  }

  get linePrecision() {
    if (this._raycaster.params.Line) {
      return this._raycaster.params.Line.threshold;
    }

    return 1;
  }

  set linePrecision(precision: number) {
    if (this._raycaster.params.Line) {
      this._raycaster.params.Line.threshold = precision;
    }
  }
}
