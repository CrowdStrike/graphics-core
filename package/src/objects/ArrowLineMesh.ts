// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { ArrowLineMesh as _ArrowLineMesh } from './_ArrowLineMesh';

import type { TextStyle } from '../data/TextStyle';
import type { LabelMesh } from './LabelMesh';
import type { ILineMeshType } from './LineMesh';
import type { ArrowLineMeshSettings } from './settings/ArrowLineMeshSettings';
import type * as THREE from 'three';

export interface IArrowLineMesh {
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  new (
    material: THREE.Material | THREE.Material[],
    arrowMaterial: THREE.MeshBasicMaterial,
    settings: ArrowLineMeshSettings,
  ): IArrowLineMeshType;
}

interface LabelSettings {
  defaultScale?: number;
  offset?: number;
}

export interface IArrowLineMeshType extends ILineMeshType {
  label?: LabelMesh;
  setLabel: (txt: string, colour: number, style?: TextStyle, settings?: LabelSettings) => void;
  toggleLabel: (isVisible: boolean) => void;
}

export const ArrowLineMesh = _ArrowLineMesh as unknown as IArrowLineMesh;
