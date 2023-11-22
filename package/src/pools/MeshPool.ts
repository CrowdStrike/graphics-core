import * as THREE from 'three';

import { ObjectPool } from '../utils/kurst/data/ObjectPool';
import { ObjectPoolInterface } from '../utils/kurst/data/ObjectPoolInterface';

export class MeshPool extends ObjectPoolInterface<THREE.Mesh> {
  geometry: THREE.BufferGeometry;
  constructor(geom: THREE.BufferGeometry) {
    super();
    this.geometry = geom;

    this.pool = new ObjectPool<THREE.Mesh>(
      () => this.createNode(),
      (o) => this.disposeNode(o),
      50,
      50,
    );
  }

  createNode() {
    return new THREE.Mesh(this.geometry);
  }

  disposeNode(o: THREE.Mesh) {
    o.geometry.dispose();

    return o;
  }
}
