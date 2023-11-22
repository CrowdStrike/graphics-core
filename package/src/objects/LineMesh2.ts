// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { LineMesh2 as _LineMesh2 } from './_LineMesh2';

import type { CurveProperties } from '../utils/LineMeshUtils';
import type { LineMeshSettings } from './settings/LineMeshSettings';
import type * as THREE from 'three';
import type { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

export interface ILineMesh2 extends THREE.Line {
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  new (material: LineGeometry, settings: LineMaterial): ILineMesh2Type;
  dispose(): void;
}

export interface ILineMesh2Type extends THREE.Line {
  addVertex(vertex?: THREE.Vector3, addBeforeLastVertex?: boolean): void;
  dispose(): void;
  flagLineDistancesForUpdate(): void;
  flagVertexColorsForUpdate(): void;
  flagVerticesForUpdate(): void;
  setMaterial(material: THREE.LineBasicMaterial): void;
  setNormalisedVertexPositionArray(a: number[]): void;
  setVertexColors(hex: number): void;
  update(): void;
  updateColorAttributes(): void;
  updateMaxVertices(count: number): void;
  matrixWorld: THREE.Matrix4;
  colorVertices: THREE.Color[];
  end: THREE.Vector3;
  endX: number;
  endY: number;
  isCurveShapeC: boolean;
  isCurveShapeS: boolean;
  length: number;
  numVertices: number;
  start: THREE.Vector3;
  startX: number;
  startY: number;
  vertices: THREE.Vector3[];
  settings: LineMeshSettings;
  _vertices: THREE.Vector3[];
  _linePositions: THREE.Float32BufferAttribute;
  _lineDistances: THREE.Float32BufferAttribute;
  _lineColors: THREE.Float32BufferAttribute;
  _positionsForLine: number[];
  _colourVertices: THREE.Color[];
  _coloursForLine: number[];
  _colors: THREE.Color[];
  _verticeXNormals: number[];
  curveProperties: CurveProperties;
  _colorsNeedUpdate: boolean;
  debugA: THREE.Mesh;
  debugB: THREE.Mesh;
}

export const LineMesh2 = _LineMesh2 as unknown as ILineMesh2;
