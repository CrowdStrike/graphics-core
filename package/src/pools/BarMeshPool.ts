import { BarMesh } from '../objects/BarMesh';
import { ObjectPool } from '../utils/kurst/data/ObjectPool';
import { ObjectPoolInterface } from '../utils/kurst/data/ObjectPoolInterface';

export class BarMeshPool extends ObjectPoolInterface<BarMesh> {
  constructor() {
    super();
    this.pool = new ObjectPool<BarMesh>(
      () => this.createNode(),
      (o) => this.disposeNode(o),
      50,
      50,
    );
  }

  createNode() {
    return new BarMesh();
  }

  disposeNode(o: BarMesh) {
    if (!Array.isArray(o.material)) {
      o.material.dispose();
    }

    o.geometry.dispose();

    return o;
  }
}
