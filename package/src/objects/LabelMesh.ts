import * as THREE from 'three';

import type { TextStyle } from '../data/TextStyle';
import type { MeshBasicTintMaterial } from '../materials/MeshBasicTintMaterial';
import type { TextGenerator } from '../textures/text/TextGenerator';
import type { BufferGeometry } from 'three/src/core/BufferGeometry';

export class LabelMesh extends THREE.Mesh<BufferGeometry, MeshBasicTintMaterial> {
  isCameraFacing = false;
  style?: TextStyle;
  text?: string;
  textGenerator?: TextGenerator;
  texture?: THREE.Texture;
  needsUpdate = true;

  // stores the page within the DynamicSpriteSheetGenerator
  // in which this text sample region is stored.
  // This is useful when we use instanced texture sampling
  // and want to know which DynamicSpriteSheet to sample from.
  spriteSheetIdx?: number;

  dispose() {
    this.textGenerator = undefined;
  }

  get width() {
    return this.textGenerator?.textWidth ?? 0;
  }

  get height() {
    return this.textGenerator?.textHeight ?? 0;
  }
}
