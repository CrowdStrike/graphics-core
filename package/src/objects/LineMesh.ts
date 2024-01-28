// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { LineMesh as _LineMesh } from './_LineMesh';

import type { CurveProperties } from '../utils/LineMeshUtils';
import type { LineMeshSettings } from './settings/LineMeshSettings';
import type * as THREE from 'three';

export interface ILineMesh extends THREE.Line {
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  new (material: THREE.LineBasicMaterial | THREE.LineDashedMaterial, settings: LineMeshSettings): ILineMeshType;
}

export interface ILineMeshType extends THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> {
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
  colorVertices: THREE.Color[];
  matrixWorld: THREE.Matrix4;
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

export const LineMesh = _LineMesh as unknown as ILineMesh;
