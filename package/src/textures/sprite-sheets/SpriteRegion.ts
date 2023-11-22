import { Block } from '../../utils/kurst/data/Block';
import { BitmapData } from '../../utils/kurst/display/BitmapData';

import type { MeshBasicTintMaterial } from '../../materials/MeshBasicTintMaterial';
import type { DynamicSpriteSheet } from '../../textures/sprite-sheets/DynamicSpriteSheet';

/**
 * SpriteRegion
 * Data for a sprite texture region to draw inside
 */
export class SpriteRegion {
  bitmap?: BitmapData;
  rect: Block;
  spriteSheet?: DynamicSpriteSheet;

  constructor(bitmap: BitmapData, spriteSheet: DynamicSpriteSheet) {
    this.bitmap = bitmap;
    this.rect = new Block();
    this.spriteSheet = spriteSheet;
  }

  get canvas() {
    return this.bitmap?.canvas;
  }

  copyToBitmap() {
    if (!this.rect || !this.bitmap) {
      return;
    }

    let bmp = new BitmapData(this.rect.width, this.rect.height);

    bmp.copyPixels(this.bitmap, this.rect, bmp.rect);

    return bmp;
  }

  setRandomColor() {
    this.bitmap?.fillRect(this.rect, 0x55ffffff * Math.random());
  }

  get bitmapWidth() {
    return this.bitmap?.width;
  }

  get bitmapHeight() {
    return this.bitmap?.height;
  }

  get texture() {
    return this.spriteSheet?.texture;
  }

  dispose() {
    this.bitmap = undefined;
    this.rect = new Block();
    this.spriteSheet = undefined;
  }

  /**
   * Returns the normalized (between 0–1) position (x, y) of
   * the region relative to the bitmap.
   */
  get normalizedCoordinates(): NormalizedBbox {
    if (!this.bitmapWidth || !this.bitmapHeight) {
      return [0, 0, 1, 1];
    }

    let xOffset = this.rect.x / this.bitmapWidth;

    // flip y-axis
    let yOffset = 1 - (this.rect.height + this.rect.y) / this.bitmapHeight;

    let width = this.rect.width / this.bitmapWidth;
    let height = this.rect.height / this.bitmapHeight;

    return [xOffset, yOffset, width, height];
  }

  /**
   * Apply the SpriteRegion bounds to a MeshBasicTintMaterial so it renders the correct part of the texture
   * @param meshBasicTintMaterial : MeshBasicTintMaterial
   */
  applyMaterialOffsets(meshBasicTintMaterial: MeshBasicTintMaterial) {
    if (!this.bitmapWidth || !this.bitmapHeight) {
      return;
    }

    const [xOffset, yOffset, normalizedWidth, normalizedHeight] = this.normalizedCoordinates;

    meshBasicTintMaterial.setRepeat(normalizedWidth, normalizedHeight);
    meshBasicTintMaterial.setOffset(xOffset, yOffset);
  }
}

export type NormalizedBbox = [number, number, number, number];
