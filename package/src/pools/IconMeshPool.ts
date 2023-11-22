import { IconGenerator } from '../generators/IconGenerator';
import { ObjectPool } from '../utils/kurst/data/ObjectPool';
import { ObjectPoolInterface } from '../utils/kurst/data/ObjectPoolInterface';

import type { IconDefinition } from '../generators/IconGenerator';
import type { IconMesh } from '../objects/IconMesh';

interface IconMeshPoolParams {
  iconDefinition: IconDefinition;
  IconMeshClass: typeof IconMesh;
  size: number;
  resize: number;
}

export class IconMeshPool extends ObjectPoolInterface<IconMesh> {
  IconMeshClass: typeof IconMesh;
  iconDefinition: IconDefinition;
  constructor({ iconDefinition, IconMeshClass, size = 50, resize = 50 }: IconMeshPoolParams) {
    super();

    this.iconDefinition = iconDefinition;
    this.IconMeshClass = IconMeshClass;
    this.pool = new ObjectPool<IconMesh>(
      () => this.createNode(),
      (o) => this.disposeNode(o),
      size,
      resize,
    );
  }

  createNode() {
    if (!this.IconMeshClass) {
      throw new Error();
    }

    return IconGenerator.make(this.iconDefinition, {
      shouldPool: false,
      shouldCache: true,
      IconMeshClass: this.IconMeshClass,
    });
  }

  disposeNode(o: IconMesh) {
    o.dispose();

    return o;
  }
}
