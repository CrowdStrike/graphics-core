import * as THREE from 'three';

export const VERTEX_LAYOUT_MODE = {
  DEFAULT: 'default',
  DISTRIBUTE: 'distribute',
  NORMALIZE: 'normalize',
  CURVE_S: 's_spline',
  CURVE_C: 'spline',
  CURVE_ARC: 'arc_spline',
};

export const SPLINE_CONTROL_OFFSET = 5;

export class LineMeshSettings {
  /**
   * Axis of the control points
   * @type {THREE.Vector3}
   */
  controlPointAxis = new THREE.Vector3(1, 0, 1);

  /**
   * offset of the conrtrol point from their origin. This will be overiden if  `controlPointOffsetPercentage` is set
   * @type {number}
   */
  controlPointOffset = 50;

  /**
   * offset the control point by a percentage of the start / end positions. this overrides the controlPointOffset
   * and only applies to CURVE_S
   * @type {percentage}
   */
  controlPointOffsetPercentage?: number;

  /**
   * if set this will offset a spline's control point by X or Y when start and end point are coplanar
   * this only applied to CURVE_S
   * @type {Vector3|null}
   */
  coplanarOffsets?: THREE.Vector3;

  /**
   * override coplanar strategy .
   * @type {THREE.Vector3}
   */
  coplanarOverride = new THREE.Vector3(0, 0, 0);

  /**
   * axes to check for coplanar start and end coordinated. axis values of 0 will be ignored
   * @type {THREE.Vector3}
   */
  coplanarOffsetStrategy = new THREE.Vector3(1, 1, 1);

  /**
   * Equal divisions of line segments ( works with distributeVertices = true )
   * @type {number}
   */
  divisions = 0;

  /**
   * draw mode, specify type of line to render
   * @type {string}
   */
  drawMode: string = VERTEX_LAYOUT_MODE.DEFAULT;

  /**
   * add a wobble to the line
   * @type {boolean}
   */
  isWobbleEnabled = false;

  /**
   * maximum number of vertices for a line
   * @type {number}
   */
  maxVertices = 2;

  /**
   * DEV: Randomize the colors of the vertices
   * @type {boolean}
   */
  randomizeVertexColors = false;

  /**
   * show the control points for splines
   * @type {boolean}
   */
  showDebugControlPoints = false;

  /**
   * Default color of vertices
   * @type {THREE.Color}
   */
  vertexColor = new THREE.Color(0x626262);

  /**
   * Max X random wobble. Useful for debugging and visual inspecting the segmentation of a line
   * @type {number}
   */
  wobbleX = 3;

  /**
   * Max Y random wobble. Useful for debugging and visual inspecting the segmentation of a line
   * @type {number}
   */
  wobbleY = 3;

  constructor(settings?: {
    controlPointAxis?: THREE.Vector3;
    controlPointOffset?: number;
    controlPointOffsetPercentage?: number;
    coplanarOffsets?: THREE.Vector3;
    coplanarOverride?: THREE.Vector3;
    coplanarOffsetStrategy?: THREE.Vector3;
    divisions?: number;
    drawMode?: string;
    isWobbleEnabled?: boolean;
    maxVertices?: number;
    randomizeVertexColors?: boolean;
    showDebugControlPoints?: boolean;
    vertexColor?: THREE.Color;
    wobbleX?: number;
    wobbleY?: number;
  }) {
    if (settings) {
      Object.assign(this, settings);
    }
  }

  clone(target?: LineMeshSettings) {
    let r = target ? target : new LineMeshSettings();

    if (!r) {
      throw new Error('lineMesh.clone() settings should be undefined');
    }

    r.controlPointAxis = this.controlPointAxis.clone();
    r.controlPointOffset = this.controlPointOffset;
    r.controlPointOffsetPercentage = this.controlPointOffsetPercentage;
    r.coplanarOffsetStrategy = this.coplanarOffsetStrategy.clone();
    r.coplanarOffsets = this.coplanarOffsets?.clone();
    r.coplanarOverride = this.coplanarOverride.clone();
    r.divisions = this.divisions;
    r.drawMode = this.drawMode;
    r.isWobbleEnabled = this.isWobbleEnabled;
    r.maxVertices = this.maxVertices;
    r.randomizeVertexColors = this.randomizeVertexColors;
    r.showDebugControlPoints = this.showDebugControlPoints;
    r.vertexColor = this.vertexColor.clone();
    r.wobbleX = this.wobbleX;
    r.wobbleY = this.wobbleY;

    return r;
  }
}
