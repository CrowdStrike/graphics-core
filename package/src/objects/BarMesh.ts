import * as THREE from 'three';

import type { Material } from 'three/src/materials/Material';

export class BarMesh extends THREE.Mesh {
  static BOX_GEOMETRY: THREE.BoxGeometry;

  constructor(material?: Material | Material[]) {
    if (!BarMesh.BOX_GEOMETRY) {
      BarMesh.BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
      BarMesh.BOX_GEOMETRY.translate(0.5, 0.5, 0.5);
      BarMesh.BOX_GEOMETRY.computeBoundingBox();
    }

    super(BarMesh.BOX_GEOMETRY, material);
  }

  get width() {
    return this.scale.x;
  }

  set width(v) {
    this.scale.x = v;
  }

  get height() {
    return this.scale.y;
  }

  set height(v) {
    this.scale.y = v;
  }

  get depth() {
    return this.scale.z;
  }

  set depth(v) {
    this.scale.z = v;
  }
}
