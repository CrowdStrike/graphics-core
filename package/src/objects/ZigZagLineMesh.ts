import { LineMesh } from './LineMesh';

import type { ZigZagLineMeshSettings } from './settings/ZigZagLineMeshSettings';
import type * as THREE from 'three';

export class ZigZagLineMesh extends LineMesh {
  constructor(
    material: THREE.LineBasicMaterial | THREE.LineDashedMaterial,
    settings: ZigZagLineMeshSettings,
  ) {
    super(material, settings);
  }

  update() {
    super.update();

    let l = this._vertices.length;
    let { xDistance } = this.settings as ZigZagLineMeshSettings;

    for (let c = 0; c < l; c++) {
      this._linePositions.setX(c, this._vertices[c].x + (c % 2 === 0 ? -xDistance : xDistance));
    }

    this.flagVerticesForUpdate();
  }
}
