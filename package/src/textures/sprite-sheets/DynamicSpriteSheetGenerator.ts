import { DynamicSpriteSheet } from './DynamicSpriteSheet';

const CULL_MOD = 5;

/**
 * Manages dynamic sprite sheets: when an object requests a region this will look at all active DynamicSpriteSheet
 * elements for a region with enough space to contain the requested image. If none are found - it will create a new one.
 */
export class DynamicSpriteSheetGenerator {
  private _unoptimizedSpriteSheets: DynamicSpriteSheet[] = [];
  private _optimizedSpriteSheets: DynamicSpriteSheet[] = [];
  private _cullCount = 0;
  private readonly _defaultWidth: number | undefined;
  private readonly _defaultHeight: number | undefined;

  constructor(
    defaultWidth: number | undefined = undefined,
    defaultHeight: number | undefined = undefined,
  ) {
    this._cullCount = 0;
    this._defaultWidth = defaultWidth;
    this._defaultHeight = defaultHeight;
  }

  /**
   * Get a region of a sprite sheet with enough space for our texture
   * @returns {SpriteRegion}
   */
  requestRegion(width: number, height: number, size?: number) {
    if (isNaN(height) || isNaN(width)) {
      throw new Error('DynamicSpriteSheetGenerator.requestRegion width/height must be a number');
    }

    let dynamicSpriteSheetData = this.findSpritesheetWithSpace(width, height);

    if (!dynamicSpriteSheetData) {
      dynamicSpriteSheetData = new DynamicSpriteSheet();
      dynamicSpriteSheetData.createBitmap(
        size ?? (this._defaultWidth || width),
        size ?? (this._defaultHeight || height),
        1,
      );
      this._unoptimizedSpriteSheets.push(dynamicSpriteSheetData);
    }

    if (this._cullCount % CULL_MOD === 0) {
      this._cullCount = 0;
      this._cull();
    }

    this._cullCount++;

    return dynamicSpriteSheetData.allocateSpace(width, height);
  }

  /**
   * Find a sprite sheet with enough space for our texture, returns null if there is not enough space
   * @param width : Number
   * @param height : Number
   * @returns {DynamicSpriteSheet}
   */
  private findSpritesheetWithSpace(width: number, height: number) {
    let l = this._unoptimizedSpriteSheets.length;
    let dynamicSpriteSheetData: DynamicSpriteSheet;
    let hasSpace = false;

    for (let c = 0; c < l; c++) {
      dynamicSpriteSheetData = this._unoptimizedSpriteSheets[c] as DynamicSpriteSheet;
      hasSpace = dynamicSpriteSheetData.hasRemainingSpace(width, height);

      if (hasSpace) {
        return dynamicSpriteSheetData;
      }
    }

    return null;
  }

  /**
   * Move sprite sheets with no more space to optimised array to avoid searching them in the future.
   * @private
   */
  _cull() {
    let c = this._unoptimizedSpriteSheets.length;
    let dsd: DynamicSpriteSheet;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (--c < 0) {
        break;
      }

      if (this._unoptimizedSpriteSheets[c]?.readyForCull()) {
        dsd = this._unoptimizedSpriteSheets.splice(c, 1)[0] as DynamicSpriteSheet;
        this._optimizedSpriteSheets.push(dsd);
      }
    }
  }

  freeze() {
    this._optimizedSpriteSheets.push(...this._unoptimizedSpriteSheets);
    this._unoptimizedSpriteSheets = [];
  }

  /**
   *
   */
  dispose() {
    let c;

    for (c = 0; c < this._unoptimizedSpriteSheets.length; c++) {
      this._unoptimizedSpriteSheets[c]?.dispose();
    }

    for (c = 0; c < this._optimizedSpriteSheets.length; c++) {
      this._optimizedSpriteSheets[c]?.dispose();
    }

    this._unoptimizedSpriteSheets = [];
    this._optimizedSpriteSheets = [];
    this._cullCount = 0;
  }

  get bitmaps() {
    return this.spriteSheets.map((s) => {
      return s.bitmap;
    });
  }

  get textures() {
    return this.spriteSheets.map((s) => s.texture);
  }

  get textureCount() {
    return this.textures.length;
  }

  get firstBitmap() {
    return this._optimizedSpriteSheets[0]?.bitmap;
  }

  get spriteSheets() {
    return [...this._optimizedSpriteSheets, ...this._unoptimizedSpriteSheets];
  }

  get currentSpriteSheet() {
    return this.spriteSheets.slice(-1)[0];
  }

  getPageForDynamicSpriteSheetId(id: string) {
    return this.spriteSheets.map((s) => s.id).indexOf(id);
  }
}
