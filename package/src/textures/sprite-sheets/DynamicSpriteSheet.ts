import * as THREE from "three";

import { NumberUtils } from "../../graph-utils-v2/utils/number-utils";
import { Block } from "../../utils/kurst/data/Block";
import { Packer } from "../../utils/kurst/data/Packer";
import { BitmapData } from "../../utils/kurst/display/BitmapData";
import { SpriteRegion } from "./SpriteRegion";

/**
 * Wraps a BitmapData (HTMLCanvasElement) and allows us to pack multiple elements into one image
 * This will return a `SpriteRegion` for every bit of allocated space for an image
 */
export class DynamicSpriteSheet {
  static CULL_SIZE = { width: 300, height: 100 };

  regions: SpriteRegion[] = [];
  bitmap?: BitmapData;
  tmpBlock? = new Block(); // temporary block for testing allocatable space in sprite sheet
  _packer?: Packer;
  _texture?: THREE.Texture;

  width?: number;
  height?: number;

  id: string;

  constructor() {
    this.id = NumberUtils.generateUUID();
    this.regions = [];
    this.tmpBlock = new Block(); // temporary block for testing allocatable space in sprite sheet
  }

  /**
   * As 3D can only handle textures which are a power of two, this will create a canvas which
   * is rounded up to the nearest power of two the requested bitmap size
   */
  createBitmap(width: number, height: number, bitmapSizeMultiplier = 3) {
    this.width = NumberUtils.roundupNearestPowerOfTwo(
      width * bitmapSizeMultiplier
    );
    this.height = NumberUtils.roundupNearestPowerOfTwo(
      height * bitmapSizeMultiplier
    );
    this.bitmap = new BitmapData(this.width, this.height, true);
    this._packer = new Packer(this.width, this.height);
  }

  /**
   * Allocate space for a texture in the sprite sheet
   * @param width : Number - width of texture
   * @param height : Number - height of texture
   * @returns {SpriteRegion} or {null} if there is no space left in the Spritesheet
   */
  allocateSpace(width: number, height: number) {
    if (!this.bitmap) {
      return;
    }

    let region = new SpriteRegion(this.bitmap, this);

    region.rect.width = width;
    region.rect.height = height;

    this._packer?.fitBlock(region.rect);
    this.regions.push(region);

    return region;
  }

  /**
   * Check if a block has space left for a specified dimension
   * @param w : Width
   * @param h : Height
   * @returns {*}
   */
  hasRemainingSpace(w: number, h: number): boolean {
    if (!this.tmpBlock || !this._packer) {
      return false;
    }

    this.tmpBlock.x = 0;
    this.tmpBlock.y = 0;
    this.tmpBlock.w = w;
    this.tmpBlock.h = h;
    this.tmpBlock.fit = { h: NaN, w: NaN, x: NaN, y: NaN };

    return this._packer.doesBlockFit(this.tmpBlock);
  }

  /**
   * Check if a block has space left (defined by DynamicSpriteSheet.CULL_SIZE)
   * @returns {Boolean}
   */
  readyForCull() {
    if (!this.tmpBlock) {
      return false;
    }

    this.tmpBlock.x = 0;
    this.tmpBlock.y = 0;
    this.tmpBlock.w = DynamicSpriteSheet.CULL_SIZE.width;
    this.tmpBlock.h = DynamicSpriteSheet.CULL_SIZE.height;
    this.tmpBlock.fit = { h: NaN, w: NaN, x: NaN, y: NaN };

    return !this._packer?.doesBlockFit(this.tmpBlock);
  }

  /**
   * @returns {HTMLCanvasElement}
   */
  get canvas() {
    return this.bitmap?.canvas;
  }

  dispose() {
    for (let c = 0; c < this.regions.length; c++) {
      this.regions[c]?.dispose();
    }

    this.regions = [];
    this.bitmap?.dispose();
    this.bitmap = undefined;
    this.tmpBlock = undefined;
    this._packer = undefined;

    if (this._texture) {
      this._texture.dispose();
    }

    this._texture = undefined;
  }

  get texture() {
    if (!this._texture) {
      this._texture = new THREE.Texture(this.bitmap?.canvas);
      this._texture.magFilter = THREE.LinearFilter;
      this._texture.minFilter = THREE.LinearFilter;
    }

    this._texture.needsUpdate = true;

    return this._texture;
  }
}
