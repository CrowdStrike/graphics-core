/**
 * This is an implementation of a quadratic cubic curve
 */

import { CubicBezierCurve3, Vector3 } from 'three';
import * as THREE from 'three';

import { DefaultLineBezier2Settings, LineBezier2 } from './line-bezier2';

import type { BezierControlPointSettings } from './line-bezier2';

export class DefaultLineBezier3Settings extends DefaultLineBezier2Settings {
  c1: BezierControlPointSettings = [100, 0.25];
  c2: BezierControlPointSettings = [-100, 0.75];
}

export type LineBezier3Settings = Partial<DefaultLineBezier3Settings>;

export class LineBezier3 extends LineBezier2<CubicBezierCurve3> {
  _controlPoint2 = new Vector3();

  _controlPoint2Offset = 0;

  // which point of the line defined by this.start/this.end
  // does the orthogonal projection of the control point intersect?
  _controlPoint2IntersectsLineAt = 0.5;

  _controlPoint2Mesh?: THREE.Mesh;

  // the second control point of the Bezier curve
  c2: BezierControlPointSettings;

  // this is defined in the base class
  declare settings: Required<LineBezier3Settings>;

  protected isControlPoint2Set = false;

  constructor(settings: LineBezier3Settings) {
    super({ ...new DefaultLineBezier3Settings(), ...settings });

    this.lineType = 'cubic';

    this.c2 = this.settings.c2;
    this.setControlPoint2Offsets(...this.c2);

    if (this.allControlPointsSet) {
      this.makeCurve();
      this.setColor(this.settings.color, this.settings.endColor);
    }
  }

  public makeCurve() {
    // We need this check here because we're calling super(),
    // which in turn calls makeCurve().
    if (!this.allControlPointsSet)
      throw new Error('LineBezier3: no control points defined on this curve');

    this.curve = new CubicBezierCurve3(
      this.start,
      this.controlPoint1,
      this.controlPoint2,
      this.end,
    );

    this._splineLength = this.curve.getLength();

    this.curvePoints = this.curve.getPoints(this.numCurvePoints);

    return this.curvePoints;
  }

  protected updateCurve() {
    if (!this.curve) return;

    this.curve.v2.copy(this.controlPoint2);

    super.updateCurve();
  }

  enableDebugging(isVisible: boolean) {
    super.enableDebugging(isVisible);

    if (isVisible) {
      if (this._controlPoint2Mesh) {
        this._controlPoint2Mesh.visible = true;
      } else {
        this._controlPoint2Mesh = new THREE.Mesh(
          LineBezier2._debugGeometry,
          LineBezier2._debugMaterial,
        );
        this._controlPoint2Mesh.position.set(
          this._controlPoint2.x,
          this._controlPoint2.y,
          this._controlPoint2.z,
        );

        this.add(this._controlPoint2Mesh);
      }
    } else {
      if (this._controlPoint2Mesh) {
        this._controlPoint2Mesh.visible = false;
      }
    }
  }

  get controlPoint2() {
    return this._controlPoint2;
  }

  setControlPoint2Offsets(offset: number, intersectsLineAt: number) {
    this.c2 = [offset, intersectsLineAt];
    this.setControlPointOffsets(offset, intersectsLineAt, this._controlPoint2);

    this._controlPoint2IntersectsLineAt = intersectsLineAt;
    this._controlPoint2Offset = offset;
    this.isControlPoint2Set = true;

    if (this._controlPoint2Mesh) {
      this._controlPoint2Mesh.position.copy(this._controlPoint2);

      // position in front of the line mesh
      this._controlPoint2Mesh.position.z += 1;
    }

    return this;
  }

  get allControlPointsSet() {
    return this.isControlPoint1Set && this.isControlPoint2Set;
  }
}
