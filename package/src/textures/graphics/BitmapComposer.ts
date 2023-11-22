import { BitmapData } from '../../utils/kurst/display/BitmapData';
import { ColorTransform } from '../../utils/kurst/geom/ColorTransform';
import { Rectangle } from '../../utils/kurst/geom/Rectangle';
import { DynamicSpriteSheetGenerator } from '../sprite-sheets/DynamicSpriteSheetGenerator';

import type { MeshBasicTintMaterial } from '../../materials/MeshBasicTintMaterial';
import type { SpriteRegion } from '../../textures/sprite-sheets/SpriteRegion';

/**
 * This allows for image composition (i.e. blitting a colour transformed background with an icon on top), it uses
 * the DynamicSpriteSheetGenerator to pack multiple ImageComposer elements on a single canvas (for optimisation)
 */
export class BitmapComposer {
  static spriteSheetGenerator: DynamicSpriteSheetGenerator | undefined;
  static _TMP_DEST_RECT: Rectangle;
  static _TMP_BITMAP: BitmapData;
  static _TMP_DEST_CT: ColorTransform;
  static spriteSheetGeneratorDefaultWidth = 256;
  static spriteSheetGeneratorDefaultHeight = 256;

  padding: number;
  width: number;
  height: number;
  _spriteRegion: SpriteRegion | undefined;

  constructor(width: number, height: number, padding = 6) {
    if (!BitmapComposer.spriteSheetGenerator) {
      BitmapComposer.spriteSheetGenerator = new DynamicSpriteSheetGenerator(
        BitmapComposer.spriteSheetGeneratorDefaultWidth,
        BitmapComposer.spriteSheetGeneratorDefaultHeight,
      );
      BitmapComposer._TMP_DEST_RECT = new Rectangle();
      BitmapComposer._TMP_DEST_CT = new ColorTransform();
      BitmapComposer._TMP_BITMAP = new BitmapData(10, 10);
    }

    this.padding = padding;
    this.width = width;
    this.height = height;
    this._spriteRegion = BitmapComposer.spriteSheetGenerator.requestRegion(
      width + padding,
      height + padding,
    );
  }

  draw(
    bitmapSrc: BitmapData,
    destRect: Rectangle,
    targetColor: number | null = null,
    alpha: number | null = null,
  ) {
    if (!this._spriteRegion || !BitmapComposer._TMP_BITMAP.context) {
      return;
    }

    let { rect, bitmap } = this._spriteRegion;

    // Static rect keeps memory usage low / GC use down
    let padOffset = this.padding > 0 ? this.padding / 2 : 0;

    BitmapComposer._TMP_BITMAP.fillRect(BitmapComposer._TMP_BITMAP.rect, 0x00000000);
    BitmapComposer._TMP_BITMAP.width = bitmapSrc.width;
    BitmapComposer._TMP_BITMAP.height = bitmapSrc.height;

    if (alpha !== null) {
      BitmapComposer._TMP_BITMAP.context.globalAlpha = alpha;
    }

    BitmapComposer._TMP_BITMAP.copyPixels(bitmapSrc, bitmapSrc.rect, bitmapSrc.rect);
    BitmapComposer._TMP_DEST_RECT.x = destRect.x + rect.x + padOffset;
    BitmapComposer._TMP_DEST_RECT.y = destRect.y + rect.y + padOffset;
    BitmapComposer._TMP_DEST_RECT.width = destRect.width;
    BitmapComposer._TMP_DEST_RECT.height = destRect.height;

    if (alpha !== null) {
      BitmapComposer._TMP_BITMAP.context.globalAlpha = 1;
    }

    // Color transform bitmap if specified
    if (targetColor) {
      BitmapComposer._TMP_DEST_CT.color = targetColor; // Static CT keeps mem usage low
      BitmapComposer._TMP_BITMAP.colorTransform(
        BitmapComposer._TMP_BITMAP.rect,
        BitmapComposer._TMP_DEST_CT,
      );
    }

    // Blit to sprite sheet bitmap
    bitmap?.copyPixels(
      BitmapComposer._TMP_BITMAP,
      BitmapComposer._TMP_BITMAP.rect,
      BitmapComposer._TMP_DEST_RECT,
    );
    BitmapComposer._TMP_BITMAP.height = BitmapComposer._TMP_BITMAP.width = 10;
  }

  dispose() {
    if (this._spriteRegion) {
      this._spriteRegion.dispose();
    }

    this._spriteRegion = undefined;
  }

  getTexture() {
    if (!this._spriteRegion) {
      throw new Error('spriteRegion is not defined');
    }

    return this._spriteRegion.texture;
  }

  get canvas() {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (!this._spriteRegion || !this._spriteRegion?.bitmap) {
      throw new Error('spriteRegion is not defined');
    }

    return this._spriteRegion.bitmap.canvas;
  }

  get spriteRegion() {
    return this._spriteRegion;
  }

  applyMaterialOffsets(meshBasicTintMaterial: MeshBasicTintMaterial) {
    this._spriteRegion?.applyMaterialOffsets(meshBasicTintMaterial);
  }

  static dispose() {
    if (BitmapComposer.spriteSheetGenerator) {
      BitmapComposer.spriteSheetGenerator.dispose();
      BitmapComposer.spriteSheetGenerator = undefined;
    }
  }
}
