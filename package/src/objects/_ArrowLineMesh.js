import * as THREE from 'three';

import { TextStyle } from '../data/TextStyle.ts';
import { LabelGenerator } from '../generators/LabelGenerator.ts';
import { ThreeGeomUtils } from '../utils/kurst/utils/ThreeGeomUtils.ts';
import { LineMesh } from './LineMesh.ts';
import { ArrowLineMeshSettings } from './settings/ArrowLineMeshSettings.ts';

const SPLINE_DIRECTION_READ_OFFSET = 0.05;
const HALF_PI = Math.PI / 2;

export class ArrowLineMesh extends LineMesh {
  static hasTranslated = false;
  static tmpMidPoint = new THREE.Vector3();

  constructor(lineMaterial, arrowMaterial, settings = null) {
    super(lineMaterial, settings);

    if (!ArrowLineMesh.CYLINDER_GEOMETRY) {
      ArrowLineMesh.CYLINDER_GEOMETRY = new THREE.CylinderGeometry(0, 0.5, 1, 5, 1);
      ArrowLineMesh.CYLINDER_GEOMETRY.translate(0, -0.5, 0);
      ArrowLineMesh.CYLINDER_GEOMETRY.computeBoundingBox();
    }

    if (!ArrowLineMesh.HANDLE_GEOMETRY) {
      ArrowLineMesh.HANDLE_GEOMETRY = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
      ArrowLineMesh.HANDLE_GEOMETRY.translate(0, 1, 0);
      ArrowLineMesh.HANDLE_GEOMETRY.computeBoundingBox();
    }

    this.settings = settings === null ? new ArrowLineMeshSettings() : settings;

    this.label = undefined;
    this._arrowEndPoint = new THREE.Vector3(); // Temp variable for spline calc
    this._arrowPosition = new THREE.Vector3(); // Position of arrow
    this._splineLength = NaN;
    this._arrowPoint = new THREE.Vector3(); // Temp variable for spline calc
    this._axis = new THREE.Vector3(); // Rotation _axis of arrow
    this._direction = new THREE.Vector3(); // Direction of arrow ( from _start / _end vectors )
    this._quaternion = new THREE.Quaternion(); // Rotation of arrow

    this.endArrowMesh = new THREE.Mesh(ArrowLineMesh.CYLINDER_GEOMETRY, arrowMaterial);
    this.endArrowMesh.scale.set(
      this.settings.arrowScale,
      this.settings.arrowScale,
      this.settings.arrowScale,
    );

    this.handleMesh = new THREE.Mesh(ArrowLineMesh.HANDLE_GEOMETRY, arrowMaterial);
    this.handleMesh.scale.set(
      this.settings.handleScale.x,
      this.settings.handleScale.y,
      this.settings.handleScale.z,
    );

    this.startArrowMesh = new THREE.Mesh(ArrowLineMesh.CYLINDER_GEOMETRY, arrowMaterial);
    this.startArrowMesh.scale.set(
      this.settings.arrowScale,
      this.settings.arrowScale,
      this.settings.arrowScale,
    );

    if (this.settings.hasEndArrow) {
      this.add(this.endArrowMesh);
    }

    if (this.settings.hasStartArrow) {
      this.add(this.startArrowMesh);
    }

    if (this.settings.hasHandle && !this.isCurveShapeC) {
      // splines do not currently support handles
      this.add(this.handleMesh);
    }
  }

  setLabel(
    txt,
    colourHex = 0xffffff,
    style = undefined,
    { defaultScale = 0.25, offset = -30 } = {},
  ) {

    if (!style) {
      style = new TextStyle();
      style.name = 'arrow-line-label';
      style.fontSize = 20;
      style.fontColor = colourHex;
      style.fontName = 'Calibre';
      style.pixelDensity = 2;
    }

    // if a label already exists, update it in-place
    if (this.label) {
      LabelGenerator.update(this.label, txt, style, { offset: new THREE.Vector3(0, offset, 0) })
      this.label.scale.set(defaultScale, defaultScale, defaultScale);

      return this.label;
    }

    this.label = LabelGenerator.make(txt, style, { offset: new THREE.Vector3(0, offset, 0) });
    this.label.scale.set(defaultScale, defaultScale, defaultScale);
    this.label.material.isLookingAtCamera = false;
    this.add(this.label);

    return this.label;
  }

  dispose() {
    if (this.settings) {
      if (this.settings.hasEndArrow) {
        this.remove(this.endArrowMesh);
      }

      if (this.settings.hasStartArrow) {
        this.remove(this.startArrowMesh);
      }

      if (this.settings.hasHandle && !this.isCurveShapeC) {
        // splines do not currently support handles
        this.remove(this.handleMesh);
      }
    }

    super.dispose();

    if (this.label) {
      this.remove(this.label);
      this.label.dispose();
    }

    this._arrowEndPoint = null;
    this._arrowPoint = null;
    this._arrowPosition = null;
    this._axis = null;
    this._direction = null;
    this._quaternion = null;
    this._splineLength = null;

    this.endArrowMesh = null;
    this.handleMesh = null;
    this.settings = null;
    this.startArrowMesh = null;
  }

  update() {
    super.update();

    if (this.isCurveShapeC || this.isCurveShapeS) {
      let curve = null;

      if (this.isCurveShapeS) {
        curve = this.curveProperties.cubicBezierCurve3;
      } else {
        curve = this.curveProperties.quadraticBezierCurve;
      }

      curve.updateArcLengths();
      this._splineLength = curve.getLength();

      if (this.settings.hasEndArrow) {
        let endPosition = (this._splineLength - this.settings.endOffset) / this._splineLength;

        curve.getPointAt(endPosition, this._arrowPoint);
        curve.getPointAt(endPosition - SPLINE_DIRECTION_READ_OFFSET, this._arrowEndPoint);
        this._updateDirection(this._arrowEndPoint, this._arrowPoint);
        this._align(this.endArrowMesh);
        this.endArrowMesh.position.set(this._arrowPoint.x, this._arrowPoint.y, this._arrowPoint.z);
      }

      if (this.settings.hasStartArrow) {
        let startPosition = this.settings.startOffset / this._splineLength;

        curve.getPointAt(startPosition + SPLINE_DIRECTION_READ_OFFSET, this._arrowEndPoint);
        curve.getPointAt(startPosition, this._arrowPoint);
        this._updateDirection(this._arrowEndPoint, this._arrowPoint);
        this._align(this.startArrowMesh);
        this.startArrowMesh.position.set(
          this._arrowPoint.x,
          this._arrowPoint.y,
          this._arrowPoint.z,
        );
      }

      if (this.label && this.isCurveShapeC) {
        const labelPaddingTop = 8;
        const labelPaddingBottom = -2;

        let { end, start } = this;
        let midPoint = curve.getPointAt(0.5, ArrowLineMesh.tmpMidPoint);
        let { controlPointOffset } = this.settings;
        let dir = controlPointOffset > 0 ? 1 : -1;
        let offset = this.label.height * this.label.scale.x * dir;
        let angle = Math.atan2(end.y - start.y, end.x - start.x);

        offset += controlPointOffset > 0 ? labelPaddingTop : labelPaddingBottom;
        this.label.position.set(
          (Math.sin(angle) * offset) / 2 + midPoint.x,
          (-Math.cos(angle) * offset) / 2 + midPoint.y,
          0,
        );

        this._updateDirection(this.start, this.end);
        this._align(this.label, this.start, this.end);
        this.label.rotation.z += HALF_PI;

        if (this.label.rotation.z - HALF_PI > 0) {
          this.label.rotation.z += Math.PI;
        }
      }
    } else {
      if (this.settings.hasEndArrow) {
        this._updateDirection(this.end, this.start);
        this._positionInBetween(
          this.endArrowMesh,
          this.end,
          this.start,
          this.settings.endPosition,
          -this.settings.endOffset,
        );
        this._align(this.endArrowMesh, this.end, this.start);
      }

      if (this.settings.hasStartArrow) {
        this._updateDirection(this.start, this.end);
        this._positionInBetween(
          this.startArrowMesh,
          this.start,
          this.end,
          this.settings.startPosition,
          -this.settings.startOffset,
        );
        this._align(this.startArrowMesh, this.start, this.end);
      }

      if (this.settings.hasHandle) {
        this._updateDirection(this.start, this.end);
        this._positionInBetween(
          this.handleMesh,
          this.start,
          this.end,
          this.settings.handlePosition,
          0,
        );
        this._align(this.handleMesh, this.start, this.end);
      }

      if (this.label) {
        this._updateDirection(this.start, this.end);
        this._positionInBetween(this.label, this.start, this.end, 0.5);
        this._align(this.label, this.start, this.end);
        this.label.rotation.z += HALF_PI;

        if (this.label.rotation.z - HALF_PI > 0) {
          this.label.rotation.z += Math.PI;
        }
      }
    }
  }

  tmpLabelOffset = new THREE.Vector3(0, 0, 0);

  _updateDirection(startPoint, endPoint) {
    this._direction.set(endPoint.x, endPoint.y, endPoint.z);
    this._direction.sub(startPoint);
    this._direction.normalize();

    if (this._direction.y >= -1 && this._direction.y <= -0.9999) {
      // Edge label text gets inverted when edge is exactly vertical, this remaps the direction to ensure
      // the text is not inverted
      this._direction.y = -0.9998;
    }
  }

  _positionInBetween(mesh, startPoint, endPoint, percentPosition, offset = 0) {
    ThreeGeomUtils.pointInBetween(startPoint, endPoint, this._arrowPosition, percentPosition);
    mesh.position.set(
      this._arrowPosition.x + this._direction.x * offset,
      this._arrowPosition.y + this._direction.y * offset,
      this._arrowPosition.z + this._direction.z * offset,
    );
  }

  _align(mesh) {
    if (this._direction.y > 0.99999) {
      this._quaternion.set(0, 0, 0, 1);
    } else if (this._direction.y < -0.99999) {
      this._quaternion.set(1, 0, 0, 0);
    } else {
      this._axis.set(this._direction.z, 0, -this._direction.x).normalize();
      this._quaternion.setFromAxisAngle(this._axis, Math.acos(this._direction.y));
    }

    mesh.quaternion.copy(this._quaternion);
  }

  toggleLabel(isVisible) {
    this.label.visible = isVisible;
  }
}

ArrowLineMesh.CYLINDER_GEOMETRY = null;
ArrowLineMesh.HANDLE_GEOMETRY = null;
