import { ArrowLineMesh } from '../objects/ArrowLineMesh';
import { ObjectPool } from '../utils/kurst/data/ObjectPool';
import { ObjectPoolInterface } from '../utils/kurst/data/ObjectPoolInterface';

import type { IArrowLineMeshType } from '../objects/ArrowLineMesh';
import type { ArrowLineMeshSettings } from '../objects/settings/ArrowLineMeshSettings';
import type * as THREE from 'three';

interface ArrowLineMeshPoolParams {
  lineMaterial: THREE.LineBasicMaterial | THREE.LineDashedMaterial;
  arrowMaterial: THREE.MeshBasicMaterial;
  arrowLineSettings: ArrowLineMeshSettings;
}

export class ArrowLinePool extends ObjectPoolInterface<IArrowLineMeshType> {
  arrowLineSettings?: ArrowLineMeshSettings;
  arrowMaterial?: THREE.MeshBasicMaterial;
  lineMaterial?: THREE.LineBasicMaterial | THREE.LineDashedMaterial;

  constructor({ lineMaterial, arrowMaterial, arrowLineSettings }: ArrowLineMeshPoolParams) {
    super();
    this.arrowLineSettings = arrowLineSettings;
    this.arrowMaterial = arrowMaterial;
    this.lineMaterial = lineMaterial;
    this.pool = new ObjectPool<IArrowLineMeshType>(
      () => this.createLine(),
      (o) => this.disposeLine(o),
      50,
      50,
    );
  }

  createLine() {
    if (!this.arrowLineSettings || !this.lineMaterial || !this.arrowMaterial) {
      throw new Error('ArrowLinePool properties have been disposed from pool');
    }

    return new ArrowLineMesh(this.lineMaterial, this.arrowMaterial, this.arrowLineSettings.clone());
  }

  disposeLine(o: IArrowLineMeshType) {
    o.dispose();

    return o;
  }

  dispose() {
    super.dispose();
    this.arrowLineSettings = undefined;
    this.arrowMaterial = undefined;
    this.lineMaterial = undefined;
  }
}
