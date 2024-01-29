// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import * as THREE from 'three';

import { NumberUtils } from '../graph-utils-v2/utils/number-utils';
import { SPLINE_CONTROL_OFFSET, VERTEX_LAYOUT_MODE } from '../objects/settings/LineMeshSettings';
import { DebugSpheres } from '../utils/kurst/utils/DebugSpheres';
import { ThreeGeomUtils } from '../utils/kurst/utils/ThreeGeomUtils';

import type { ILineMeshType } from '../objects/LineMesh';
import type { ILineMesh2Type } from '../objects/LineMesh2';

/*
 *  - Do not position first or last vertex these are assigned to start / end vertices
 *  - Where possible computing line distance / color updates are done inline with distribution / normalisation
 */

export interface CurveProperties {
  controlEnd: THREE.Vector3;
  controlStart: THREE.Vector3;
  cubicBezierCurve3: THREE.CubicBezierCurve3 | null;
  quadraticBezierCurve: THREE.QuadraticBezierCurve3 | null;
  splineCurveControlPoint: THREE.Vector3;
  splineCurveResults: THREE.Vector3[];
}

export class LineMeshUtils {
  static _vIncrement = new THREE.Vector3();
  static _vDivisor = new THREE.Vector3();
  static _vDir = new THREE.Vector3();
  static _vTmpA = new THREE.Vector3();
  static _vTmpB = new THREE.Vector3();
  static _vDistance = new THREE.Vector3();
  static _vCoplanarDirection = new THREE.Vector3();
  static _midPoint = new THREE.Vector3();

  static initSplineCurveProperties(lineMesh: ILineMeshType | ILineMesh2Type): CurveProperties {
    let isCurveShapeC =
      lineMesh.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_C ||
      lineMesh.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_ARC;
    let isCurveShapeS = lineMesh.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_S;

    if (isCurveShapeC) {
      lineMesh.settings.maxVertices = lineMesh.settings.divisions + 2;
    }

    let splineCurveControlPoint = new THREE.Vector3();
    let quadraticBezierCurve = isCurveShapeC
      ? new THREE.QuadraticBezierCurve3(lineMesh.start, splineCurveControlPoint, lineMesh.end)
      : null;
    let controlStart = new THREE.Vector3();
    let controlEnd = new THREE.Vector3();
    let cubicBezierCurve3 = isCurveShapeS
      ? new THREE.CubicBezierCurve3(lineMesh.start, controlStart, controlEnd, lineMesh.end)
      : null;
    let splineCurveResults: THREE.Vector3[] = [];

    return {
      controlEnd,
      controlStart,
      cubicBezierCurve3,
      quadraticBezierCurve,
      splineCurveControlPoint,
      splineCurveResults,
    };
  }

  static createDebugControlPoints(lineMesh: ILineMeshType | ILineMesh2Type) {
    let debugA = DebugSpheres.createSphere(1, 0xff0000);
    let debugB = DebugSpheres.createSphere(1, 0x00ff00);

    lineMesh.add(debugA, debugB);

    return { debugA, debugB };
  }

  static distribute(line: ILineMeshType | ILineMesh2Type, shouldUpdateVertexColours = false) {
    let l = line._vertices.length;
    let { settings } = line;
    let color = null;
    let distance = 0;
    let isLineMesh2 = !!line.isLine2;

    LineMeshUtils._vIncrement.subVectors(line.end, line.start);
    LineMeshUtils._vDivisor.set(l - 1, l - 1, l - 1);
    LineMeshUtils._vIncrement.divide(LineMeshUtils._vDivisor);

    for (let c = 1; c < l - 1; c++) {
      let v = line._vertices[c];

      // --- set vertex / line position attributes
      v.x = line.start.x + LineMeshUtils._vIncrement.x * c;
      v.y = line.start.y + LineMeshUtils._vIncrement.y * c;
      v.z = line.start.z + LineMeshUtils._vIncrement.z * c;

      // DEV: sometimes it is nice to have wobbly lines to debug things
      if (line.settings.isWobbleEnabled) {
        v.y += NumberUtils.random(-settings.wobbleY, settings.wobbleY);
        v.x += NumberUtils.random(-settings.wobbleX, settings.wobbleX);
      }

      if (isLineMesh2) {
        line._positionsForLine.push(v.x, v.y, v.z);

        if (shouldUpdateVertexColours) {
          color = line._colourVertices[c];
          line._coloursForLine.push(color.r, color.g, color.b);
        }
      } else {
        line._linePositions.setX(c, v.x);
        line._linePositions.setY(c, v.y);
        line._linePositions.setZ(c, v.z);

        if (shouldUpdateVertexColours) {
          color = line._colors[c];
          line._lineColors.setX(c, color.r);
          line._lineColors.setY(c, color.g);
          line._lineColors.setZ(c, color.b);
        }

        // --- set line distances attributes
        if (c > 0) {
          distance += v.distanceTo(line._vertices[c - 1]);
          line._lineDistances.setX(c, distance);
        }
      }
    }
  }

  static normalize(line: ILineMeshType | ILineMesh2Type, shouldUpdateVertexColours = false) {
    let l = line._vertices.length;
    let { settings } = line;
    let color = null;
    let distance = 0;
    let isLineMesh2 = !!line.isLine2;
    let vnLengthLessOne;

    if (l >= line._verticeXNormals.length) {
      LineMeshUtils._vIncrement.subVectors(line.end, line.start);
      vnLengthLessOne = line._verticeXNormals.length - 1;

      // normalize position of all but first and last vertices
      for (let c = 1; c < l - 1; c++) {
        let v = line._vertices[c];

        // --- set vertex / line position attributes

        if (c < vnLengthLessOne) {
          // use normals array

          v.x = line.start.x + LineMeshUtils._vIncrement.x * line._verticeXNormals[c];
          v.y = line.start.y + LineMeshUtils._vIncrement.y * c;
          v.z = line.start.z + LineMeshUtils._vIncrement.z * c;
        } else {
          // otherwise hide vertex ( move it to last position )

          v.x = line.end.x;
          v.y = line.end.y;
          v.z = line.end.z;
        }

        // DEV: sometimes it is nice to have wobbly lines to debug things
        if (settings.isWobbleEnabled) {
          v.y += NumberUtils.random(-settings.wobbleY, settings.wobbleY);
          v.x += NumberUtils.random(-settings.wobbleX, settings.wobbleX);
        }

        if (isLineMesh2) {
          line._positionsForLine.push(v.x, v.y, v.z);

          if (shouldUpdateVertexColours) {
            color = line._colourVertices[c];
            line._coloursForLine.push(color.r, color.g, color.b);
          }
        } else {
          line._linePositions.setX(c, v.x);
          line._linePositions.setY(c, v.y);
          line._linePositions.setZ(c, v.z);

          // --- set color attributes
          if (shouldUpdateVertexColours) {
            color = line._colors[c];
            line._lineColors.setX(c, color.r);
            line._lineColors.setY(c, color.g);
            line._lineColors.setZ(c, color.b);
          }

          // --- set line distances attributes
          if (c > 0) {
            distance += v.distanceTo(line._vertices[c - 1]);
            line._lineDistances.setX(c, distance);
          }
        }
      }
    }
  }

  static curveC(line: ILineMeshType | ILineMesh2Type, shouldUpdateVertexColours = false) {
    let l = line._vertices.length;
    let color = null;
    let distance = 0;
    let isLineMesh2 = !!line.isLine2;

    let control = line.start.distanceTo(line.end) / SPLINE_CONTROL_OFFSET;

    line.curveProperties.splineCurveControlPoint.set(
      line.end.x + (line.start.x - line.end.x) / 2 + (line.end.x === line.start.x ? 0 : control),
      line.end.y + (line.start.y - line.end.y) / 2 + (line.end.y === line.start.y ? 0 : control),
      line.end.z + (line.start.z - line.end.z) / 2 + (line.end.z === line.start.z ? 0 : control),
    );

    if (line.curveProperties?.quadraticBezierCurve) {
      line.curveProperties.splineCurveResults = line.curveProperties.quadraticBezierCurve.getPoints(
        line.settings.maxVertices,
      );
    }

    for (let c = 0; c < l; c++) {
      let v = line.curveProperties.splineCurveResults[c];

      if (c > 0 && c < l - 1) {
        if (isLineMesh2) {
          line._positionsForLine.push(v.x, v.y, v.z);
          color = line._colourVertices[c];
          line._coloursForLine.push(color.r, color.g, color.b);
        } else {
          line._linePositions.setX(c, v.x);
          line._linePositions.setY(c, v.y);
          line._linePositions.setZ(c, v.z);

          if (line._colorsNeedUpdate && shouldUpdateVertexColours) {
            color = line._colors[c];
            line._lineColors.setX(c, color.r);
            line._lineColors.setY(c, color.g);
            line._lineColors.setZ(c, color.b);
          }
        }
      }

      if (!isLineMesh2 && c > 0) {
        distance += v.distanceTo(line.curveProperties.splineCurveResults[c - 1]);
        line._lineDistances.setX(c, distance);
      }
    }
  }

  static curveArc(line: ILineMeshType | ILineMesh2Type, shouldUpdateVertexColours = false) {
    let l = line._vertices.length;
    let color = null;
    let isLineMesh2 = !!line.isLine2;
    let { end, start } = line;
    let midPoint = ThreeGeomUtils.pointInBetween(start, end, LineMeshUtils._midPoint, 0.5);
    let { settings } = line;
    let { controlPointOffset } = settings;
    let distance = 0;
    let angle = Math.atan2(end.y - start.y, end.x - start.x);

    line.curveProperties.splineCurveControlPoint.set(midPoint.x, midPoint.y, midPoint.z);

    line.curveProperties.splineCurveControlPoint.set(
      Math.sin(angle) * controlPointOffset + midPoint.x,
      -Math.cos(angle) * controlPointOffset + midPoint.y,
      0,
    );

    if (line.curveProperties?.quadraticBezierCurve) {
      line.curveProperties.splineCurveResults = line.curveProperties.quadraticBezierCurve.getPoints(
        line.settings.maxVertices,
      );
    }

    for (let c = 0; c < l; c++) {
      let v = line.curveProperties.splineCurveResults[c];

      if (c > 0 && c < l - 1) {
        if (isLineMesh2) {
          line._positionsForLine.push(v.x, v.y, v.z);
          color = line._colourVertices[c];
          line._coloursForLine.push(color.r, color.g, color.b);
        } else {
          line._linePositions.setX(c, v.x);
          line._linePositions.setY(c, v.y);
          line._linePositions.setZ(c, v.z);

          if (line._colorsNeedUpdate && shouldUpdateVertexColours) {
            color = line._colors[c];
            line._lineColors.setX(c, color.r);
            line._lineColors.setY(c, color.g);
            line._lineColors.setZ(c, color.b);
          }
        }
      }

      if (!isLineMesh2 && c > 0) {
        distance += v.distanceTo(line.curveProperties.splineCurveResults[c - 1]);
        line._lineDistances.setX(c, distance);
      }
    }
  }

  static curveS(line: ILineMeshType | ILineMesh2Type, shouldUpdateVertexColours = false) {
    let l = line._vertices.length;
    let { start, end } = line;
    let { settings } = line;
    let color = null;
    let distance = 0;
    let isLineMesh2 = !!line.isLine2;

    LineMeshUtils._vDir.set(0, 0, 0);

    let dir = LineMeshUtils._vDir.subVectors(line.start, line.end).normalize();
    let {
      controlPointAxis,
      controlPointOffset,
      controlPointOffsetPercentage,
      coplanarOffsetStrategy,
      coplanarOffsets,
      coplanarOverride,
    } = settings;

    if (controlPointOffsetPercentage) {
      // prettier-ignore
      let isXCoplanar = (start.x === end.x && Boolean(coplanarOffsetStrategy.x)) || coplanarOverride.x > 0;
      // prettier-ignore
      let isYCoplanar = (start.y === end.y && Boolean(coplanarOffsetStrategy.y)) || coplanarOverride.y > 0;
      // prettier-ignore
      let isZCoplanar = (start.z === end.z && Boolean(coplanarOffsetStrategy.z)) || coplanarOverride.z > 0;

      if ((isXCoplanar || isYCoplanar || isZCoplanar) && coplanarOffsets !== null) {
        // --- if the line is coplanar then give it a separate offset
        let coplanarDirection = LineMeshUtils._vCoplanarDirection;

        coplanarDirection.set(Number(isXCoplanar), Number(isYCoplanar), Number(isZCoplanar));

        if (coplanarOffsets) {
          line.curveProperties.controlStart.set(
            line.start.x + coplanarDirection.x * coplanarOffsets.x,
            line.start.y + coplanarDirection.y * coplanarOffsets.y,
            line.start.z + coplanarDirection.z * coplanarOffsets.z,
          );
          line.curveProperties.controlEnd.set(
            line.end.x + coplanarDirection.x * coplanarOffsets.x,
            line.end.y + coplanarDirection.y * coplanarOffsets.y,
            line.end.z + coplanarDirection.z * coplanarOffsets.z,
          );
        }
      } else {
        // --- apply offset of control point as a percentage of the per axis distance between the start / end points
        let distance = LineMeshUtils._vDistance;
        let invert = end.y > start.y ? 1 : -1;
        let tmpA = LineMeshUtils._vTmpA;
        let tmpB = LineMeshUtils._vTmpB;

        tmpA.set(start.x, 0, 0);
        tmpB.set(end.x, 0, 0);
        distance.x = tmpA.distanceTo(tmpB) * controlPointOffsetPercentage;

        tmpA.set(0, start.y, 0);
        tmpB.set(0, end.y, 0);
        distance.y = tmpA.distanceTo(tmpB) * controlPointOffsetPercentage;

        tmpA.set(0, 0, start.z);
        tmpB.set(0, 0, end.z);
        distance.z = tmpA.distanceTo(tmpB) * controlPointOffsetPercentage;

        line.curveProperties.controlStart.set(
          line.start.x + distance.x * controlPointAxis.x * invert,
          line.start.y + distance.y * controlPointAxis.y * invert,
          line.start.z + distance.z * controlPointAxis.z * invert,
        );
        line.curveProperties.controlEnd.set(
          line.end.x - distance.x * controlPointAxis.x * invert,
          line.end.y - distance.y * controlPointAxis.y * invert,
          line.end.z - distance.z * controlPointAxis.z * invert,
        );
      }
    } else {
      // --- set the control point by a fixed value
      line.curveProperties.controlStart.set(
        line.start.x - controlPointOffset * dir.x * controlPointAxis.x,
        line.start.y - controlPointOffset * dir.y * controlPointAxis.y,
        line.start.z - controlPointOffset * dir.z * controlPointAxis.z,
      );
      line.curveProperties.controlEnd.set(
        line.end.x + controlPointOffset * dir.x * controlPointAxis.x,
        line.end.y + controlPointOffset * dir.y * controlPointAxis.y,
        line.end.z + controlPointOffset * dir.z * controlPointAxis.z,
      );
    }

    if (settings.showDebugControlPoints) {
      line.debugA.position.set(
        line.curveProperties.controlStart.x,
        line.curveProperties.controlStart.y,
        line.curveProperties.controlStart.z,
      );
      line.debugB.position.set(
        line.curveProperties.controlEnd.x,
        line.curveProperties.controlEnd.y,
        line.curveProperties.controlEnd.z,
      );
    }

    if (line.curveProperties.cubicBezierCurve3) {
      line.curveProperties.splineCurveResults = line.curveProperties.cubicBezierCurve3.getPoints(
        line.settings.maxVertices,
      );
    }

    if (isLineMesh2) {
      for (let c = 0; c < l; c++) {
        let v = line.curveProperties.splineCurveResults[c];

        color = line._colourVertices[c];

        if (c > 0 && c < l - 1) {
          line._positionsForLine.push(v.x, v.y, v.z);
          line._coloursForLine.push(color.r, color.g, color.b);
        }
      }
    } else {
      for (let c = 0; c < l; c++) {
        // --- set vertex / line position attributes
        let v = line.curveProperties.splineCurveResults[c];

        if (c > 0 && c < l - 1) {
          line._linePositions.setX(c, v.x);
          line._linePositions.setY(c, v.y);
          line._linePositions.setZ(c, v.z);
        }

        // --- set color attributes
        if (line._colorsNeedUpdate && shouldUpdateVertexColours) {
          color = line._colors[c];
          line._lineColors.setX(c, color.r);
          line._lineColors.setY(c, color.g);
          line._lineColors.setZ(c, color.b);
        }

        // --- set line distances attributes
        if (c > 0) {
          distance += v.distanceTo(line.curveProperties.splineCurveResults[c - 1]);
          line._lineDistances.setX(c, distance);
        }
      }
    }
  }

  static vertexArray(line: ILineMeshType | ILineMesh2Type, shouldUpdateVertexColours = false) {
    let l = line._vertices.length;
    let color = null;
    let distance = 0;
    let isLineMesh2 = !!line.isLine2;

    for (let c = 0; c < l; c++) {
      let v = line._vertices[c];

      if (isLineMesh2) {
        // --- set vertex / line position attributes
        if (c > 0 && c < l - 1) {
          line._positionsForLine.push(v.x, v.y, v.z);
        }

        // --- set color attributes
        if (shouldUpdateVertexColours) {
          color = line._colourVertices[c];
          line._coloursForLine.push(color.r, color.g, color.b);
        }
      } else {
        // --- set vertex / line position attributes
        line._linePositions.setX(c, v.x);
        line._linePositions.setY(c, v.y);
        line._linePositions.setZ(c, v.z);

        // --- set line distances attributes
        if (c > 0) {
          distance += v.distanceTo(line._vertices[c - 1]);
          line._lineDistances.setX(c, distance);
        }

        // --- set color attributes
        if (line._colorsNeedUpdate && shouldUpdateVertexColours) {
          color = line._colors[c];
          line._lineColors.setX(c, color.r);
          line._lineColors.setY(c, color.g);
          line._lineColors.setZ(c, color.b);
        }
      }
    }
  }
}
