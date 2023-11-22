/**
 * This is an implementation of a quadratic bezier curve
 */

import { QuadraticBezierCurve3, Vector3 } from "three";
import * as THREE from "three";

import { NumberUtils } from "../../graph-utils-v2/utils/number-utils";
import { ThreeGeomUtils } from "../../utils/kurst/utils/ThreeGeomUtils";
import { DefaultLineV2Settings, LineV2 } from "./line-base";

import type { Curve } from "three";

export type BezierControlPointSettings = [
  offset: number,
  intersectsLineAt: number
];

export class DefaultLineBezier2Settings extends DefaultLineV2Settings {
  numCurvePoints = 150;
  c1: BezierControlPointSettings = [100, 0.5];
}

export type LineBezier2Settings = Partial<DefaultLineBezier2Settings>;

export class LineBezier2<
  T extends Curve<Vector3> = QuadraticBezierCurve3
> extends LineV2 {
  static _debugGeometry = new THREE.CircleGeometry(4);
  static _debugMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  _controlPoint1 = new Vector3();
  _controlPoint1Offset = 0;

  // which point of the line defined by this.start/this.end
  // does the orthogonal projection of the control point intersect?
  _controlPoint1IntersectsLineAt = 0.5;

  // used for debugging the control points
  _controlPoint1Mesh?: THREE.Mesh;
  _controlPointMaterial?: THREE.Material;

  curvePoints?: THREE.Vector3[];

  curve?: T;

  // the first control point of the Bezier curve
  c1: BezierControlPointSettings;

  // this is defined in the base class
  declare settings: Required<LineBezier2Settings>;

  _splineLength = 0;

  protected isControlPoint1Set = false;

  constructor(settings: LineBezier2Settings) {
    super({ ...new DefaultLineBezier2Settings(), ...settings });

    this.lineType = "quadratic";

    this.enableDebugging(this.showDebugMode);

    this.c1 = this.settings.c1;
    this.setControlPoint1Offsets(...this.c1);

    if (this.allControlPointsSet) {
      // This method is only called one time, for performance-reasons.
      this.makeCurve();
      this.setColor(this.settings.color, this.settings.endColor);
    }
  }

  public update(shouldUpdateCurve?: boolean) {
    if (shouldUpdateCurve) {
      // curve points need to be re-generated
      // when line.start or line.end change

      // in order for this to happen,
      // setControlPoint1Offsets will need to be called again
      this.updateCurve();
    }

    super.update();
  }

  protected setPositions() {
    if (!this.curvePoints) {
      this.curvePoints = this.makeCurve();
    }

    this._positions.length = 0;

    this.curvePoints.forEach((v) => {
      this._positions.push(v.x, v.y, v.z);
    });

    this.geometry.setPositions(this._positions);

    this.setTotalLineSegmentInstanceCounts();
  }

  public setColor(
    color: THREE.Color | number,
    endColor?: THREE.Color | number
  ) {
    if (!this.curvePoints) {
      return;
    }

    this.color.set(color);
    this._colors.length = 0;

    this.curvePoints?.forEach(() => {
      this._colors.push(this.color.r, this.color.g, this.color.b);
    });

    this.geometry.setColors(this._colors);

    this.assignColorsToVariables(color, endColor);

    // this sets this.material.gradientStart/gradientEnd
    this.setGradient(this.color, this.endColor);

    this.setArrowColors(this.color, this.endColor);
  }

  protected updateArrows() {
    if (!this.curve) return;

    const startOffset = 0;
    const startPosition = startOffset / this._splineLength;

    const endOffset = 0;
    const endPosition = (this._splineLength - endOffset) / this._splineLength;

    if (this.useInstancedArrows) {
      // START ARROW
      // ============================================
      // sample a point a bit after the start
      this.curve.getPointAt(this.startArrowPosition + 0.05, LineBezier2.tmpVec);

      // sample a point at the start
      this.curve.getPointAt(this.startArrowPosition, LineBezier2.tmpVec2);

      // store the direction vector in this.direction
      this.updateDirection(LineBezier2.tmpVec, LineBezier2.tmpVec2);

      if (typeof this.startArrowInstanceIdx === "number") {
        this.align(LineV2.mesh);

        if (this.startArrowRotation !== 0) {
          LineV2.mesh.rotateZ(this.startArrowRotation);
          LineV2.mesh.quaternion;
        }

        LineV2.arrows.setRotation(
          this.startArrowInstanceIdx,
          LineV2.mesh.quaternion
        );

        LineV2.arrows.setPosition(
          this.startArrowInstanceIdx,
          LineBezier2.tmpVec2.x,
          LineBezier2.tmpVec2.y,
          LineBezier2.tmpVec2.z + 0.1
        );
        LineV2.arrows.setScale(
          this.startArrowInstanceIdx,
          this.getWidthAtLinePercentage(this.startArrowPosition),
          this.getWidthAtLinePercentage(this.startArrowPosition),
          0.1
        );
      }

      // sample a point at the end
      this.curve.getPointAt(this.endArrowPosition, LineBezier2.tmpVec);

      // sample a point right before the end
      this.curve.getPointAt(this.endArrowPosition - 0.05, LineBezier2.tmpVec2);

      // END ARROW
      // ============================================

      // store the direction vector in this.direction
      this.updateDirection(LineBezier2.tmpVec2, LineBezier2.tmpVec);

      if (typeof this.endArrowInstanceIdx === "number") {
        this.align(LineV2.mesh);

        if (this.endArrowRotation !== 0) {
          LineV2.mesh.rotateZ(this.endArrowRotation);
          LineV2.mesh.quaternion;
        }

        LineV2.arrows.setRotation(
          this.endArrowInstanceIdx,
          LineV2.mesh.quaternion
        );

        LineV2.arrows.setPosition(
          this.endArrowInstanceIdx,
          LineBezier2.tmpVec.x,
          LineBezier2.tmpVec.y,
          LineBezier2.tmpVec.z + 0.1
        );
        LineV2.arrows.setScale(
          this.endArrowInstanceIdx,
          this.getWidthAtLinePercentage(this.endArrowPosition),
          this.getWidthAtLinePercentage(this.endArrowPosition),
          0.1
        );
      }
    } else {
      if (this.startArrowMesh) {
        // sample a point a bit after the start
        this.curve.getPointAt(startPosition + 0.05, LineBezier2.tmpVec);

        // sample a point at the start
        this.curve.getPointAt(startPosition, LineBezier2.tmpVec2);

        // store the direction vector in this.direction
        this.updateDirection(LineBezier2.tmpVec, LineBezier2.tmpVec2);

        // align the mesh to this.direction vector
        this.align(this.startArrowMesh);
        this.startArrowMesh.position.set(
          LineBezier2.tmpVec2.x,
          LineBezier2.tmpVec2.y,
          LineBezier2.tmpVec2.z
        );
      }

      if (this.endArrowMesh) {
        // sample a point at the end
        this.curve.getPointAt(endPosition, LineBezier2.tmpVec);

        // sample a point right before the end
        this.curve.getPointAt(endPosition - 0.05, LineBezier2.tmpVec2);

        // store the direction vector in this.direction
        this.updateDirection(LineBezier2.tmpVec2, LineBezier2.tmpVec);

        // align the mesh to this.direction vector
        this.align(this.endArrowMesh);
        this.endArrowMesh.position.set(
          LineBezier2.tmpVec.x,
          LineBezier2.tmpVec.y,
          LineBezier2.tmpVec.z
        );
      }
    }
  }

  protected getLabelOffsetFromMidpoint() {
    let labelPaddingTop = 8;
    let labelPaddingBottom = -20;

    let dir = this._controlPoint1Offset > 0 ? 1 : -1;
    let offset =
      ((this.lineWidth + this.endLineWidth) / 2) * dir + this.labelSize * dir;

    offset +=
      this._controlPoint1Offset > 0 ? labelPaddingTop : labelPaddingBottom;

    return offset;
  }

  protected updateLabel() {
    if (this.label) {
      if (!this.curve) return;

      this.curve?.getPointAt(0.45, LineBezier2.tmpVec);
      this.curve?.getPoint(0.55, LineBezier2.tmpVec2);

      let midPoint = this.curve?.getPointAt(0.5);

      // if angle is < 0 the slope around the center is downwards
      // if angle is > 0 the slope around the center is upwards
      let angle = Math.atan2(
        LineBezier2.tmpVec2.y - LineBezier2.tmpVec.y,
        LineBezier2.tmpVec2.x - LineBezier2.tmpVec.x
      );

      let offset = this.getLabelOffsetFromMidpoint();

      this.updateDirection(LineBezier2.tmpVec2, LineBezier2.tmpVec);

      if (typeof this.labelInstanceIdx === "number") {
        LineV2.labels.setPosition(
          this.labelInstanceIdx,
          (Math.sin(angle) * offset) / 2 + midPoint.x,
          (-Math.cos(angle) * offset) / 2 + midPoint.y,
          this.position.z + 1
        );
        this.align(LineBezier2.mesh);

        LineV2.mesh.rotation.z += LineBezier2.HALF_PI;

        if (LineV2.mesh.rotation.z - LineBezier2.HALF_PI > 0) {
          LineV2.mesh.rotation.z += Math.PI;
        }

        LineV2.labels.setRotation(
          this.labelInstanceIdx,
          this.qt.setFromAxisAngle(
            this.vec3.set(0, 0, 1),
            LineBezier2.mesh.rotation.z
          )
        );
        LineV2.labels.mesh.position.z = this.position.z + 1;
      }
    }
  }

  protected makeCurve() {
    if (!this.allControlPointsSet)
      throw new Error("LineBezier2: no control points defined on this curve");

    // TODO: fix me ?
    this.curve = new QuadraticBezierCurve3(
      this.start,
      this.controlPoint1,
      this.end
    ) as unknown as T;

    this._splineLength = this.curve.getLength();

    this.curvePoints = this.curve.getPoints(this.numCurvePoints);

    return this.curvePoints;
  }

  /**
   * This method gets called after changing this.start or this.end,
   * or this.controlPoint1
   */
  protected updateCurve() {
    if (!this.curve) return;

    if (this.curve instanceof QuadraticBezierCurve3) {
      this.curve.v1.copy(this.controlPoint1);
    }

    this.curvePoints = this.curve.getPoints(this.numCurvePoints);

    for (let i = 0; i < this.curvePoints.length; i++) {
      if (!this.curvePoints[i]) {
        continue;
      }

      this._positions[i * 3] = this.curvePoints[i]?.x ?? 0;
      this._positions[i * 3 + 1] = this.curvePoints[i]?.y ?? 0;
      this._positions[i * 3 + 2] = this.curvePoints[i]?.z ?? 0;
    }

    this.geometry.setPositions(this._positions);
    this.curve?.updateArcLengths();
  }

  displace() {
    this.start.x = this.start.x + NumberUtils.random(-20, 20);
    this.start.y = this.start.y + NumberUtils.random(-20, 20);
    this.end.y = this.end.y + NumberUtils.random(-20, 20);
    this.setControlPoint1Offsets(
      this._controlPoint1Offset,
      this._controlPoint1IntersectsLineAt
    );
    this.updateCurve();
    this.updateArrows();
  }

  jiggle() {
    for (let i = 0; i < this._positions.length; i += 3) {
      let y = this._positions[i + 1];

      if (!y) continue;

      this._positions[i + 1] = y + NumberUtils.random(-2, 2);
    }

    this.geometry.setPositions(this._positions);
    this.curve?.updateArcLengths();
  }

  enableDebugging(isVisible: boolean) {
    this.showDebugMode = isVisible;

    if (isVisible) {
      if (this._controlPoint1Mesh) {
        this._controlPoint1Mesh.visible = true;
      } else {
        this._controlPoint1Mesh = new THREE.Mesh(
          LineBezier2._debugGeometry,
          LineBezier2._debugMaterial
        );
        this._controlPoint1Mesh.position.copy(this._controlPoint1);
        this.add(this._controlPoint1Mesh);
      }
    } else {
      if (this._controlPoint1Mesh) {
        this._controlPoint1Mesh.visible = false;
      }
    }
  }

  get controlPoint1() {
    return this._controlPoint1;
  }

  /**
   * This function determines where the control point is located
   * by defining at which normalized point its projection intersects
   * the line defined by this.start and this.end.
   *
   * @param intersectsLineAt a value typically in the [0, 1] range
   * indicating where the projection of the control point
   * intersects the line.
   * @param offset (in absolute units) how much above/below/left/right
   * of the line the control point is
   * @returns
   */
  protected setControlPointOffsets(
    offset: number,
    intersectsLineAt: number,
    target: THREE.Vector3
  ) {
    const midPoint = ThreeGeomUtils.pointInBetween(
      this.start,
      this.end,
      LineBezier2.tmpVec,
      intersectsLineAt
    );

    let angle = Math.atan2(
      this.end.y - this.start.y,
      this.end.x - this.start.x
    );

    target.set(midPoint.x, midPoint.y, midPoint.z);
    target.set(
      Math.sin(angle) * offset + midPoint.x,
      -Math.cos(angle) * offset + midPoint.y,
      midPoint.z
    );

    return this;
  }

  setControlPoint1Offsets(offset: number, intersectsLineAt: number) {
    this.c1 = [offset, intersectsLineAt];
    this.setControlPointOffsets(offset, intersectsLineAt, this._controlPoint1);

    this._controlPoint1IntersectsLineAt = intersectsLineAt;
    this._controlPoint1Offset = offset;
    this.isControlPoint1Set = true;

    if (this._controlPoint1Mesh) {
      this._controlPoint1Mesh.position.copy(this._controlPoint1);

      // position in front of the line mesh
      this._controlPoint1Mesh.position.z += 1;
    }

    return this;
  }

  get allControlPointsSet() {
    return this.isControlPoint1Set;
  }

  getWidthAtLinePercentage(x: number) {
    return THREE.MathUtils.lerp(this.startArrowScale, this.endArrowScale, x);
  }

  get numCurvePoints() {
    return this.settings.numCurvePoints;
  }
}
