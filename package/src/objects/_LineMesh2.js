import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';

import { LineMeshUtils } from '../utils/LineMeshUtils.ts';
import { line2Dictionary } from './LineMesh2Hash.ts';
import { LineMeshSettings, VERTEX_LAYOUT_MODE } from './settings/LineMeshSettings.ts';

export class LineMesh2 extends Line2 {
  constructor(material, settings = null) {
    super(undefined, material);

    if (!LineMesh2._LINES_DICTIONARY) {
      LineMesh2._LINES_DICTIONARY = {};
    }

    this.settings = settings === null ? new LineMeshSettings() : settings;

    this.start = new THREE.Vector3(10000, -10000, 0);
    this.end = new THREE.Vector3(10000, -10100, 0);

    this._colorsNeedUpdate = false; // flag to true to update the colors / send to GPU
    this._coloursForLine = [];
    this._colourVertices = []; // List of color vertices used by line
    this._lineDistancesNeedUpdate = false;
    this._positionsForLine = [];
    this._vertices = []; // List of vertices used by line
    this._verticesNeedUpdate = false;
    this._verticeXNormals = []; // Normalized array for XPositions of vertices along length of line

    this.curveProperties = LineMeshUtils.initSplineCurveProperties(this);

    if (this.settings.showDebugControlPoints) {
      let { debugA, debugB } = LineMeshUtils.createDebugControlPoints(this);

      this.debugA = debugA;
      this.debugB = debugB;
    }

    this.addVertex(this.start, false);

    for (let c = 0; c < this.settings.divisions; c++) {
      this.addVertex(new THREE.Vector3(), false);
    }

    this.addVertex(this.end, false);

    line2Dictionary.add(this);
  }

  updateMaxVertices(count) {
    if (count !== this.settings.maxVertices) {
      this.settings.maxVertices = count;
      this._colorsNeedUpdate = true;
      this.update();
    }
  }

  dispose() {
    line2Dictionary.remove(this);

    this._colourVertices = null;
    this._colorsNeedUpdate = null;
    this._vertices = null;
    this._verticeXNormals = null;

    this.end = null;
    this.start = null;
    this.material = null;
    this.settings = null;
  }

  setMaterial(lineMaterial = null) {
    if (lineMaterial) {
      this.material = lineMaterial;
    }
  }

  flagVerticesForUpdate() {
    this._verticesNeedUpdate = true;
  }

  flagVertexColorsForUpdate() {
    this._colorsNeedUpdate = true;
  }

  flagLineDistancesForUpdate() {
    this._lineDistancesNeedUpdate = true;
  }

  updateColorAttributes() {
    if (this.material.vertexColors) {
      // this._coloursForLine.length = 0;
      this._coloursForLine = [];

      let l = this._colourVertices.length;
      let color;

      for (let c = 0; c < l; c++) {
        color = this._colourVertices[c];
        this._coloursForLine.push(color.r, color.g, color.b);
      }

      this.geometry.setColors(this._coloursForLine);
    }
  }

  /** @param array<number> */
  setNormalisedVertexPositionArray(a) {
    this._verticeXNormals = a;
  }

  /** @param number */
  setVertexColors(hex) {
    let { length } = this._colourVertices;
    let color;

    for (let c = 0; c < length; c++) {
      color = this._colourVertices[c];
      color.setHex(hex);
    }

    this._colorsNeedUpdate = true;
  }

  get numVertices() {
    return this._vertices.length;
  }

  get vertices() {
    return this._vertices;
  }

  get colorVertices() {
    return this._colourVertices;
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
    return this.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_C;
  }

  get isCurveShapeS() {
    return this.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_S;
  }

  get length() {
    return this.start.distanceTo(this.end);
  }

  addVertex(vertex = null, addBeforeLastVertex = true) {
    vertex = vertex === null ? new THREE.Vector3() : vertex;

    let colour = this.settings.randomizeVertexColors
      ? new THREE.Color(Math.random(), Math.random(), Math.random())
      : this.settings.vertexColor.clone();

    if (addBeforeLastVertex) {
      this._vertices.splice(this._vertices.length - 1, 0, vertex);
      this._colourVertices.splice(this._colourVertices.length - 1, 0, colour);
    } else {
      this._vertices.push(vertex);
      this._colourVertices.push(colour);
    }

    if (this._vertices.length > this.settings.maxVertices) {
      // eslint-disable-next-line no-console
      console.error(
        `NodeLine: maximum number of vertices has been exceeded: Vertices: ${this._vertices.length}, MaxVertices: ${this.settings.maxVertices}`,
        this,
      );
    }

    this.flagVertexColorsForUpdate();
    this.flagVerticesForUpdate();
    this.flagLineDistancesForUpdate();

    return vertex;
  }

  update() {
    let shouldUpdateVertexColours = this.material.vertexColors && this._colorsNeedUpdate;
    let l = this._vertices.length;
    let [firstColour] = this._colourVertices;
    let lastColour = this._colourVertices[this._colourVertices.length - 1];

    this._positionsForLine.length = 0;
    this._coloursForLine.length = 0;

    this._positionsForLine.push(this.start.x, this.start.y, this.start.z);

    if (shouldUpdateVertexColours) {
      this._coloursForLine.push(firstColour.r, firstColour.g, firstColour.b);
    }

    switch (true) {
      case this.settings.drawMode === VERTEX_LAYOUT_MODE.DISTRIBUTE && l > 2:
        LineMeshUtils.distribute(this, shouldUpdateVertexColours);

        break;

      case this.settings.drawMode === VERTEX_LAYOUT_MODE.NORMALIZE:
        LineMeshUtils.normalize(this, shouldUpdateVertexColours);

        break;

      case this.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_C:
        LineMeshUtils.curveC(this, shouldUpdateVertexColours);

        break;

      case this.settings.drawMode === VERTEX_LAYOUT_MODE.CURVE_S: {
        LineMeshUtils.curveS(this, shouldUpdateVertexColours);

        break;
      }

      case l > 2:
        LineMeshUtils.vertexArray(this, shouldUpdateVertexColours);

        break;
    }

    this._positionsForLine.push(this.end.x, this.end.y, this.end.z);
    this.geometry.setPositions(this._positionsForLine);

    this._coloursForLine.push(lastColour.r, lastColour.g, lastColour.b);

    if (shouldUpdateVertexColours) {
      this.geometry.setColors(this._coloursForLine);
    }

    this.computeLineDistances();

    this._verticesNeedUpdate = false;
    this._lineDistancesNeedUpdate = false;
    this._colorsNeedUpdate = false;
  }
}

LineMesh2._LINES_DICTIONARY = undefined;
