import * as THREE from "three";

import { MouseControlsEvent } from "../events/MouseControlsEvent";
import { MousePickerEvents } from "../events/MousePickerEvents";
import { RenderableObject } from "../graph/core/RenderableObject";
import { NumberUtils } from "../graph-utils-v2/utils/number-utils";

import type { MousePicker } from "../core/MousePicker";
import type { ThreeJSView } from "../core/ThreeJSView";

interface MouseControlsParams {
  dragConstraint?: THREE.Vector3;
  initialScale?: number;
  isActive?: boolean;
  isTopDown?: boolean;
  isZoomEnabled?: boolean;
  maxScale?: number;
  minScale?: number;
  shouldPreventTrackpadZoom?: boolean;
  object3DContainer: THREE.Object3D;
  shouldUseModifierToZoom?: boolean;
  shouldDoubleRender?: boolean;
  threeView: ThreeJSView;
}
export class MouseControls extends RenderableObject {
  private _containerMousePosition: THREE.Vector3 = new THREE.Vector3();
  private _dragDelta = new THREE.Vector3();
  private _dragDistance = 0;
  private _isMouseThrown = false;
  private _isPinchZoom = false;
  private _isDragInit = false;
  private _maxScale: number;
  private _minScale: number;
  private _mousePicker: MousePicker;
  private _object3DContainer: THREE.Object3D;
  private _onCanvasMouseOutDelegate: () => void;
  private _previousDragPoint = new THREE.Vector3();
  private _targetScale: number;
  private _worldToLocalIntersectionPoint = new THREE.Vector3();
  private _zoomChangeEvent = new MouseControlsEvent(
    MouseControlsEvent.ZOOM_CHANGE,
  );
  private _zoomCompleteEvent = new MouseControlsEvent(
    MouseControlsEvent.ZOOM_COMPLETE,
  );
  private _zoomDelta = new THREE.Vector2();
  private _zoomRange: number;
  private _shouldBlockScrolling = false;
  private _shouldPreventTrackpadZoom;
  private shouldDoubleRender = false;

  dragConstraint: THREE.Vector3;
  dynamicDampingFactor = 0.2;
  dynamicDampingFactorTouch = 0.75;
  isDragging = false;
  isTopDown: boolean;
  isZoomEnabled: boolean;
  isZooming = false;
  shouldUseModifierToZoom = false;
  throwDampingFactor = 0.2;
  throwThreshold = 25;
  zoomSpeed = 1.2;
  threeView: ThreeJSView;

  constructor({
    dragConstraint = new THREE.Vector3(1, 1, 1),
    initialScale = 1,
    isActive = true,
    isTopDown = true,
    isZoomEnabled = true,
    maxScale = 1.8,
    minScale = 0.4,
    object3DContainer,
    shouldUseModifierToZoom = false,
    shouldPreventTrackpadZoom = true,
    shouldDoubleRender = false,
    threeView,
  }: MouseControlsParams) {
    super({ threeView });

    this.threeView = threeView;
    this.dragConstraint = dragConstraint;
    this.isTopDown = isTopDown;
    this.isZoomEnabled = isZoomEnabled;
    this.shouldUseModifierToZoom = shouldUseModifierToZoom;
    this._maxScale = maxScale;
    this._minScale = minScale;
    this._mousePicker = threeView.mousePicker;
    this._object3DContainer = object3DContainer;
    this._object3DContainer.scale.set(initialScale, initialScale, 1);
    this._onCanvasMouseOutDelegate = () => this._onCanvasMouseOut();
    this._shouldPreventTrackpadZoom = shouldPreventTrackpadZoom;
    this.shouldDoubleRender = shouldDoubleRender;
    this._targetScale = object3DContainer.scale.x;
    this._zoomRange = this._maxScale - this._minScale;

    this.isActive = isActive;
    this.threeView.canvas.addEventListener(
      "mouseout",
      this._onCanvasMouseOutDelegate,
    );

    if (this.shouldUseModifierToZoom && this.threeView.canvas.onwheel) {
      this.threeView.canvas.onwheel = () => {
        return !this._shouldBlockScrolling;
      };
    }
  }

  updateIntersectionPoint() {
    let intersectionPoint = this.threeView.project(
      this.threeView.mousePicker.mouse,
    );

    this._worldToLocalIntersectionPoint.set(
      intersectionPoint.x,
      intersectionPoint.y,
      intersectionPoint.z,
    );

    return this._object3DContainer.worldToLocal(
      this._worldToLocalIntersectionPoint,
    );
  }

  render() {
    if (this.isDragging) {
      let position = this.threeView.mousePicker.intersectionPoint;

      if (!this._isDragInit) {
        this._isDragInit = true;
        this._previousDragPoint.set(position.x, position.y, position.z);
      }

      this._dragDelta.x = position.x - this._previousDragPoint.x;
      this._dragDelta.y = position.y - this._previousDragPoint.y;
      this._dragDelta.z = position.z - this._previousDragPoint.z;

      this._object3DContainer.position.x +=
        this._dragDelta.x * this.dragConstraint.x;
      this._object3DContainer.position.y +=
        this._dragDelta.y * this.dragConstraint.y;
      this._object3DContainer.position.z +=
        this._dragDelta.z * this.dragConstraint.z;

      this._dragDistance = position.distanceTo(this._previousDragPoint);

      this._previousDragPoint.x = position.x;
      this._previousDragPoint.y = position.y;
      this._previousDragPoint.z = position.z;
    }

    if (this._isMouseThrown) {
      this._dragDelta.x -= this._dragDelta.x * this.throwDampingFactor;
      this._dragDelta.y -= this._dragDelta.y * this.throwDampingFactor;
      this._dragDelta.x = ~~(this._dragDelta.x * 10000) / 10000; // round to 4 decimal places - toFixed  / round is an order of magnitudes slower
      this._dragDelta.y = ~~(this._dragDelta.y * 10000) / 10000;

      this._object3DContainer.position.x +=
        this._dragDelta.x * this.dragConstraint.x;
      this._object3DContainer.position.y +=
        this._dragDelta.y * this.dragConstraint.y;

      if (this._dragDelta.x === 0 && this._dragDelta.y === 0) {
        this._isMouseThrown = false;
      }
    }

    if (this.isZooming && this.isZoomEnabled) {
      let dynamicDampingFactor = this._isPinchZoom
        ? this.dynamicDampingFactorTouch
        : this.dynamicDampingFactor;

      this._zoomDelta.y -= this._zoomDelta.y * dynamicDampingFactor;
      this._containerMousePosition = this.updateIntersectionPoint();

      let zoomFactor = -this._zoomDelta.y * this.zoomSpeed;
      let targetScale = this._object3DContainer.scale.x;

      targetScale -= zoomFactor;
      targetScale = ~~(targetScale * 10000) / 10000; // round to 4 decimal places - toFixed  / round is an order of magnitudes slower
      targetScale = NumberUtils.constrain(
        targetScale,
        this._minScale,
        this._maxScale,
      );

      if (!NumberUtils.isNear(targetScale, this._targetScale, 0.001)) {
        // 1) get original mouse position & scale
        let mouseX = this._containerMousePosition.x;
        let mouseY = this._containerMousePosition.y;
        let mouseZ = this._containerMousePosition.z;

        this._object3DContainer.scale.set(
          targetScale,
          targetScale,
          targetScale,
        );

        // 2) Render to update values after the scale operation and get value delta to calc diff offset caused by scale change
        this.threeView.renderer.render(
          this.threeView.scene,
          this.threeView.camera,
        );
        this._containerMousePosition = this.updateIntersectionPoint();

        let newMouseX = this._containerMousePosition.x;
        let newMouseY = this._containerMousePosition.y;
        let newMouseZ = this._containerMousePosition.z;
        let diffX = mouseX - newMouseX;
        let diffY = mouseY - newMouseY;
        let diffZ = mouseZ - newMouseZ;

        // 3) set delta offset
        this._object3DContainer.position.x -= diffX * targetScale;
        this._object3DContainer.position.y -= diffY * targetScale;

        if (!this.isTopDown) {
          this._object3DContainer.position.z -= diffZ * targetScale;
        }

        // 4) render the final position of the view
        this.shouldDoubleRender && this.threeView.render(0, true);

        this._zoomChangeEvent.percent = this.zoomPercent;
        this.dispatchEvent(this._zoomChangeEvent);
      } else {
        if (this.isZooming) {
          this._zoomCompleteEvent.percent = this.zoomPercent;
          this.dispatchEvent(this._zoomCompleteEvent);
        }

        this._isPinchZoom = false;
        this.isZooming = false;
      }

      this._targetScale = targetScale;
    }
  }

  dispose() {
    this._maxScale = 1.8;
    this._minScale = 0.4;
    this._mousePicker.removeEventListener(
      MousePickerEvents.MOUSE_WHEEL,
      this._onMouseWheel,
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
    this._mousePicker.removeEventListener(
      MousePickerEvents.TOUCH_ZOOM,
      this._onTouchZoom,
      this,
    );
    this._onCanvasMouseOutDelegate = () => undefined;
    this.isDragging = false;
    this.threeView.canvas.removeEventListener(
      "mouseout",
      this._onCanvasMouseOutDelegate,
    );
    this.threeView.canvas.onwheel = () => undefined;
  }

  didToggleActiveState(currentState: boolean) {
    this._mousePicker.removeEventListener(
      MousePickerEvents.MOUSE_WHEEL,
      this._onMouseWheel,
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
    this._mousePicker.removeEventListener(
      MousePickerEvents.TOUCH_ZOOM,
      this._onTouchZoom,
      this,
    );

    if (currentState) {
      this._mousePicker.addEventListener(
        MousePickerEvents.MOUSE_WHEEL,
        this._onMouseWheel,
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
        MousePickerEvents.TOUCH_ZOOM,
        this._onTouchZoom,
        this,
      );
    }
  }

  get zoomPercent() {
    return (this._object3DContainer.scale.x - this._minScale) / this._zoomRange;
  }

  _onStartDrag(e: MousePickerEvents) {
    if (e.event?.shiftKey) {
      return;
    }

    this.isDragging = true;
    this.isZooming = false;
    this._isMouseThrown = false;
    this._isDragInit = false;
  }

  _onStopDrag() {
    this.isDragging = false;

    if (this._dragDistance > this.throwThreshold) {
      this._isMouseThrown = true;
    }
  }

  _onMouseWheel(event: MousePickerEvents) {
    let wheelEvent = event.event as WheelEvent;

    if (this._shouldPreventTrackpadZoom) {
      wheelEvent.preventDefault();
      wheelEvent.stopImmediatePropagation();
    }

    if (this.shouldUseModifierToZoom && !wheelEvent.metaKey) {
      this._shouldBlockScrolling = false;

      return;
    }

    switch (wheelEvent.deltaMode) {
      case 2:
        // Zoom in pages
        this._zoomDelta.y -= wheelEvent.deltaY * 0.025;

        break;

      case 1:
        // Zoom in lines
        this._zoomDelta.y -= wheelEvent.deltaY * 0.01;

        break;

      default:
        // undefined, 0, assume pixels
        this._zoomDelta.y -= wheelEvent.deltaY * 0.00025;

        break;
    }

    this.isDragging = false;
    this.isZooming = true;
    this._isPinchZoom = false;

    if (this.shouldUseModifierToZoom) {
      this._shouldBlockScrolling = true;
      wheelEvent.preventDefault();
    }
  }

  _onTouchZoom(e: MousePickerEvents) {
    if (e.touchDiffDistance) {
      this._zoomDelta.y += e.touchDiffDistance * 0.01;
    }

    this._isPinchZoom = true;
    this.isDragging = false;
    this.isZooming = true;
  }

  _onCanvasMouseOut() {
    this.isDragging = false;
  }

  get scale() {
    return this._targetScale;
  }

  set scale(scale) {
    this._targetScale = scale;
    this._object3DContainer.scale.set(scale, scale, 1);
  }

  // Also dispatches a zoom event so that consumers can update entity zoom
  setScale(scale: number) {
    this.scale = scale;
    this._zoomCompleteEvent.percent = this.zoomPercent;
    this.dispatchEvent(this._zoomCompleteEvent);
  }

  get minScale() {
    return this._minScale;
  }

  get maxScale() {
    return this._maxScale;
  }
}
