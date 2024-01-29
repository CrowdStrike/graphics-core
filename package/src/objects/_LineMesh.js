import * as THREE from 'three';

import { LineMeshUtils } from '../utils/LineMeshUtils.ts';
import { LineMeshSettings, VERTEX_LAYOUT_MODE } from './settings/LineMeshSettings.ts';

export class LineMesh extends THREE.Line {
  /**
   * List of color vertices used by line
   * @type {Array}
   * @private
   */
  _colors = [];

  /**
   *flag to true to update the colors / send to GPU
   * @type {boolean}
   * @private
   */
  _colorsNeedUpdate = false; //

  /**
   * line colors, THREE.Float32BufferAttribute(this.settings.maxVertices * 3, 3)
   * @type {Float32BufferAttribute}
   * @private
   */
  _lineColors = null;

  /**
   * line distances, THREE.Float32BufferAttribute(this.settings.maxVertices, 1);
   * @type {Float32BufferAttribute}
   * @private
   */
  _lineDistances = null;

  /**
   * line positions, new THREE.Float32BufferAttribute(this.settings.maxVertices * 3, 3);
   * @type {Float32BufferAttribute}
   * @private
   */
  _linePositions = null; //

  /**
   * vertices array
   * @type {Array}
   * @private
   */
  _vertices = [];

  /**
   * Normalized array for XPositions of vertices along length of line
   * @type {Array}
   * @private
   */
  _verticeXNormals = [];

  /**
   * object containing  properties for curves
   * @type object {
   *   controlEnd,
   *   controlStart,
   *   cubicBezierCurve3,
   *   quadraticBezierCurve,
   *   splineCurveControlPoint,
   *   splineCurveResults,
   * }
   */
  curveProperties = null;

  /**
   * debug sphere for the start control point
   * @type {null}
   */
  debugA = null;

  /**
   * debug sphere for the end control point
   * @type {null}
   */
  debugB = null;

  /**
   * end vertex for the line
   * @type {THREE.Vector3}
   */
  end = new THREE.Vector3(10000, -10100, 0);

  /**
   * line settings
   * @type {LineMeshSettings}
   */
  settings = null;

  /**
   * start vertex for the line
   * @type {THREE.Vector3}
   */
  start = new THREE.Vector3(10000, -10000, 0);

  constructor(material, settings = new LineMeshSettings()) {
    super();

    this.settings = settings;

    this.curveProperties = LineMeshUtils.initSplineCurveProperties(this);
    this._lineColors = new THREE.Float32BufferAttribute(this.settings.maxVertices * 3, 3);
    this._lineDistances = new THREE.Float32BufferAttribute(this.settings.maxVertices, 1);
    this._linePositions = new THREE.Float32BufferAttribute(this.settings.maxVertices * 3, 3);

    if (this.settings.showDebugControlPoints) {
      let { debugA, debugB } = LineMeshUtils.createDebugControlPoints(this);

      this.debugA = debugA;
      this.debugB = debugB;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('color', this._lineColors);
    this.geometry.setAttribute('lineDistance', this._lineDistances);
    this.geometry.setAttribute('position', this._linePositions);
    this.material = material;

    this.addVertex(this.start, false); // Add first vertex

    for (let c = 0; c < this.settings.divisions; c++) {
      this.addVertex(new THREE.Vector3(), false);
    }

    this.addVertex(this.end, false); // Add last vertex

    this.flagVerticesForUpdate();
    this.flagLineDistancesForUpdate();
    this.flagVertexColorsForUpdate();
    this.geometry.computeBoundingSphere();
    this.material.needsUpdate = true;
  }

  /**
   * Update the Maximum number of vertices the line supports
   * @param count
   */
  updateMaxVertices(count) {
    if (count !== this.settings.maxVertices) {
      this.settings.maxVertices = count;

      this._lineDistances = new THREE.Float32BufferAttribute(this.settings.maxVertices, 1);
      this._linePositions = new THREE.Float32BufferAttribute(this.settings.maxVertices * 3, 3);
      this._lineColors = new THREE.Float32BufferAttribute(this.settings.maxVertices * 3, 3);

      this.geometry.setAttribute('position', this._linePositions);
      this.geometry.setAttribute('color', this._lineColors);
      this.geometry.setAttribute('lineDistance', this._lineDistances);

      this._colorsNeedUpdate = true;
      this.update();

      this.geometry.attributes.color.needsUpdate = true;
      this.geometry.attributes.lineDistance.needsUpdate = true;
      this.geometry.attributes.position.needsUpdate = true;
    }
  }

  dispose() {
    this._colors = null;
    this._colorsNeedUpdate = null;
    this._lineColors = null;
    this._lineDistances = null;
    this._linePositions = null;
    this._vertices = null;
    this._verticeXNormals = null;

    this.end = null;
    this.start = null;

    this.geometry.dispose();
    this.geometry = null;
    this.material = null;
    this.settings = null;
  }

  /** @param lineMaterial : LineBasicMaterial */
  setMaterial(lineMaterial = null) {
    if (lineMaterial) {
      this.material = lineMaterial;
    }
  }

  flagVerticesForUpdate() {
    this.geometry.attributes.position.needsUpdate = true;
  }

  flagVertexColorsForUpdate() {
    this.geometry.attributes.color.needsUpdate = true;
    this._colorsNeedUpdate = true;
  }

  flagLineDistancesForUpdate() {
    this.geometry.attributes.lineDistance.needsUpdate = true;
  }

  updateColorAttributes() {
    if (this.material.vertexColors) {
      let vertices = this._vertices;
      let l = vertices.length;
      let color;

      for (let c = 0; c < l; c++) {
        color = this._colors[c];
        this._lineColors.setX(c, color.r);
        this._lineColors.setY(c, color.g);
        this._lineColors.setZ(c, color.b);
      }
    }

    this.geometry.attributes.color.needsUpdate = true;
    this._colorsNeedUpdate = false;
  }

  /** @param array<number> */
  setNormalisedVertexPositionArray(a) {
    this._verticeXNormals = a;
  }

  /** @param number */
  setVertexColors(hex) {
    let { length } = this._colors;
    let color;

    for (let c = 0; c < length; c++) {
      color = this._colors[c];
      color.setHex(hex);
      this._lineColors.setX(c, color.r);
      this._lineColors.setY(c, color.g);
      this._lineColors.setZ(c, color.b);
    }

    this.geometry.attributes.color.needsUpdate = true;
  }

  get numVertices() {
    return this._vertices.length;
  }

  get vertices() {
    return this._vertices;
  }

  get colorVertices() {
    return this._colors;
  }

  get startX() {
    return this.start.x;
  }

  set startX(v) {
    this.start.x = v;
  }

  get startY() {
    return this.start.y;
  }

  set startY(v) {
    this.start.y = v;
  }

  get endX() {
    return this.end.x;
  }

  set endX(v) {
    this.end.x = v;
  }

  get endY() {
    return this.end.y;
  }

  set endY(v) {
    this.end.y = v;
  }

  get isCurveShapeC() {
    return (
      this.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_C || this.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_ARC
    );
  }

  get isCurveShapeS() {
    return this.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_S;
  }

  get length() {
    return this.start.distanceTo(this.end);
  }

  addVertex(vertex = null, addBeforeLastVertex = true) {
    vertex = vertex === null ? new THREE.Vector3() : vertex;

    if (addBeforeLastVertex) {
      this._vertices.splice(this._vertices.length - 1, 0, vertex);
    } else {
      this._vertices.push(vertex);
    }

    if (this._vertices.length > 0 && this.material.vertexColors) {
      this._colors[this._vertices.length - 1] = this.settings.randomizeVertexColors
        ? new THREE.Color(Math.random(), Math.random(), Math.random())
        : new THREE.Color().setHex(this.settings.vertexColor.getHex());
      this.flagVertexColorsForUpdate();
    }

    if (this._vertices.length > this.settings.maxVertices) {
      // eslint-disable-next-line no-console
      console.error(
        `NodeLine: maximum number of vertices has been exceeded: Vertices: ${this._vertices.length}, MaxVertices: ${this.settings.maxVertices}`,
        this,
      );
    }

    return vertex;
  }

  update() {
    let l = this._vertices.length;
    let shouldUseVertexColours = this.material.vertexColors;

    switch (true) {
      case this.settings.drawMode === VERTEX_LAYOUT_MODE.DISTRIBUTE && l > 2:
        LineMeshUtils.distribute(this, shouldUseVertexColours);

        break;

      case this.settings.drawMode === VERTEX_LAYOUT_MODE.NORMALIZE:
        LineMeshUtils.normalize(this, shouldUseVertexColours);

        break;

      case this.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_C:
        LineMeshUtils.curveC(this, shouldUseVertexColours);

        break;

      case this.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_ARC:
        LineMeshUtils.curveArc(this, shouldUseVertexColours);

        break;

      case this.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_S: {
        LineMeshUtils.curveS(this, shouldUseVertexColours);

        break;
      }

      case l > 2:
        LineMeshUtils.vertexArray(this, shouldUseVertexColours);

        break;
    }

    // Set start vertex uniform
    this._linePositions.setX(0, this.start.x);
    this._linePositions.setY(0, this.start.y);
    this._linePositions.setZ(0, this.start.z);

    // Set end vertex attribute
    this._linePositions.setX(l - 1, this.end.x);
    this._linePositions.setY(l - 1, this.end.y);
    this._linePositions.setZ(l - 1, this.end.z);

    this.geometry.computeBoundingSphere();

    // Set draw range for attributes / geometry
    this._lineDistances.updateRange.count = l;
    this._lineColors.updateRange.count = l * 3;
    this._linePositions.updateRange.count = l * 3;

    this.geometry.setDrawRange(0, l);
    this.flagLineDistancesForUpdate();
    this.flagVerticesForUpdate();

    if (this._colorsNeedUpdate) {
      this.geometry.attributes.color.needsUpdate = true;
      this._colorsNeedUpdate = false;
      this.material.needsUpdate = true;
    }

    if (this.material.isLineDashedMaterial) {
      this.computeLineDistances();
    }
  }
}
