import { LineMesh } from '../objects/LineMesh';
import { ObjectPool } from '../utils/kurst/data/ObjectPool';
import { ObjectPoolInterface } from '../utils/kurst/data/ObjectPoolInterface';

import type { ILineMesh, ILineMeshType } from '../objects/LineMesh';
import type { LineMeshSettings } from '../objects/settings/LineMeshSettings';
import type * as THREE from 'three';

interface LineMeshPoolParams {
  lineMaterial: THREE.LineBasicMaterial | THREE.LineDashedMaterial;
  lineSettings: LineMeshSettings;
  LineClass?: ILineMesh;
}

export class LineMeshPool extends ObjectPoolInterface<ILineMeshType> {
  lineSettings?: LineMeshSettings;
  lineMaterial?: THREE.LineBasicMaterial | THREE.LineDashedMaterial;
  LineClass?: ILineMesh;

  constructor({ lineMaterial, lineSettings, LineClass }: LineMeshPoolParams) {
    super();
    this.lineSettings = lineSettings;
    this.lineMaterial = lineMaterial;
    this.LineClass = !LineClass ? LineMesh : LineClass;
    this.pool = new ObjectPool<ILineMeshType>(
      () => this.createLine(),
      (o) => this.disposeLine(o),
      50,
      50,
    );
  }

  createLine(): ILineMeshType {
    if (!this.LineClass || !this.lineMaterial || !this.lineSettings) {
      throw new Error('LineMeshPool LineClass should not be undefined');
    }

    return new this.LineClass(this.lineMaterial, this.lineSettings.clone());
  }

  disposeLine(o: ILineMeshType) {
    o.dispose();
    this.lineSettings = undefined;
    this.lineMaterial = undefined;

    return o;
  }
}
