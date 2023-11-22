import * as THREE from 'three';

import { TextStyle } from '../data/TextStyle';
import { LabelGenerator } from '../generators/LabelGenerator';
import { MeshBasicTintMaterial } from '../materials/MeshBasicTintMaterial';
import { ObjectPool } from '../utils/kurst/data/ObjectPool';
import { ObjectPoolInterface } from '../utils/kurst/data/ObjectPoolInterface';

export class MeshBasicTintMaterialPool extends ObjectPoolInterface<MeshBasicTintMaterial> {
  private _tmpTextureInfo;

  constructor({ size = 25, resize = 50 } = {}) {
    super();

    let style = new TextStyle();

    style.name = 'MeshBasicTintMaterialPool-tmp-material';
    style.fontSize = 28;
    style.fontColor = 0x000000;
    style.fontName = 'Calibre';
    this._tmpTextureInfo = LabelGenerator.makeTexture('undefined', style);

    this.pool = new ObjectPool<MeshBasicTintMaterial>(
      () => this.createMaterial(),
      (o) => this.disposeMaterial(o),
      size,
      resize,
    );
  }

  createMaterial() {
    let material = new MeshBasicTintMaterial({
      map: this._tmpTextureInfo.texture,
      color: '#ffffff',
      transparent: true,
      side: THREE.DoubleSide,
    });

    if (!this._tmpTextureInfo.textGenerator.spriteRegion) {
      throw new Error('Text generator has no sprite region');
    }

    LabelGenerator._updateMaterialRepeatOffset(
      material,
      this._tmpTextureInfo.textGenerator.spriteRegion,
    );

    return material;
  }

  disposeMaterial(o: MeshBasicTintMaterial) {
    o.dispose();

    return o;
  }

  dispose() {
    super.dispose();
  }
}
