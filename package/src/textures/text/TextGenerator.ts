import { TextStyle } from '../../data/TextStyle';
import { NumberUtils } from '../../graph-utils-v2/utils/number-utils';
import { DynamicSpriteSheetGenerator } from '../sprite-sheets/DynamicSpriteSheetGenerator';

import type { SpriteRegion } from '../../textures/sprite-sheets/SpriteRegion';

/**
 * Text generator, generate text on a canvas. Uses the DynamicSpriteSheetGenerator to
 * pack multiple TextGenerator render outputs on a single canvas
 */
export class TextGenerator {
  static _spriteSheetGenerator: DynamicSpriteSheetGenerator | undefined;
  static _scratchCanvasContext: CanvasRenderingContext2D | undefined;
  uuid = NumberUtils.generateUUID();
  style: TextStyle | undefined;
  text = '';
  _width: number;
  _height: number;
  _spriteSheetGenerator: DynamicSpriteSheetGenerator | undefined;
  _spriteRegionData: SpriteRegion | undefined;

  /**
   * @param width : Number
   * @param height : Number
   * @param style : TextStyle
   */
  constructor(width: number, height: number, style?: TextStyle) {
    this.style = style === undefined ? new TextStyle() : style;

    if (!TextGenerator._spriteSheetGenerator) {
      TextGenerator._spriteSheetGenerator = new DynamicSpriteSheetGenerator();
    }

    if (!TextGenerator._scratchCanvasContext) {
      let tempCanvas = document.createElement('canvas');

      TextGenerator._scratchCanvasContext = tempCanvas.getContext('2d') as CanvasRenderingContext2D;
    }

    this._width = width;
    this._height = height;
    this._spriteSheetGenerator = TextGenerator._spriteSheetGenerator;
  }

  dispose() {
    this.uuid = '';
    this.style?.dispose();
    this.text = '';

    if (TextGenerator._spriteSheetGenerator) {
      TextGenerator._spriteSheetGenerator.dispose();
      TextGenerator._spriteSheetGenerator = undefined;
    }

    if (TextGenerator._scratchCanvasContext) {
      TextGenerator._scratchCanvasContext = undefined;
    }

    this._width = NaN;
    this._height = NaN;
    this._spriteSheetGenerator = undefined;
    this._spriteRegionData = undefined;
  }

  /**
   * @param txt : String
   * @param style : TextStyle
   * @returns {HTMLCanvasElement}
   */
  render(txt: string, style = undefined) {
    if (style) {
      this.style = style;
    }

    this.text = txt;

    if (!this._spriteRegionData) {
      this._spriteRegionData = this._spriteSheetGenerator?.requestRegion(this.textWidth, this.textHeight, 2048);
    }

    this.clear();

    if (!this.style || !this._spriteRegionData || !this._spriteRegionData.bitmap) {
      return;
    }

    if (this.style?.backgroundColor) {
      this._spriteRegionData.bitmap.fillRect(this._spriteRegionData.rect, this.style.backgroundColor);
    }

    let ctx = this._spriteRegionData.bitmap.context;

    if (!ctx) {
      return;
    }

    ctx.font = `${this.style.calcFontSize()}px ${this.style.fontName}`;
    ctx.fillStyle = `#${this.style.fontColor.toString(16)}`;

    let metrics = ctx.measureText(this.text);
    let { rect } = this._spriteRegionData;
    let xOffset = this._spriteRegionData.rect.x;
    let yOffset = this._spriteRegionData.rect.y;

    switch (this.style.alignment) {
      case TextStyle.ALIGN_CENTER:
        ctx.fillText(
          this.text,
          xOffset + (rect.width - metrics.width) / 2,
          yOffset + (rect.height / 2 + this.style.calcFontSize() / 2),
        );

        break;

      case TextStyle.ALIGN_LEFT:
        ctx.fillText(
          this.text,
          xOffset + this.style.calcPadding(),
          yOffset + (rect.height / 2 + this.style.calcFontSize() / 2),
        );

        break;

      case TextStyle.ALIGN_RIGHT:
        ctx.fillText(
          this.text,
          xOffset + (rect.width - metrics.width - this.style.calcPadding()),
          yOffset + (rect.height / 2 + this.style.calcFontSize() / 2),
        );

        break;
    }

    return this._spriteRegionData.canvas;
  }

  clear() {
    if (!this._spriteRegionData) {
      return;
    }

    let { rect } = this._spriteRegionData;

    this._spriteRegionData?.bitmap?.context?.clearRect(rect.x, rect.y, rect.width, rect.height);
  }

  /**
   * @returns {number}
   */
  get textWidth() {
    if (this.style?.autoResize && this.textMetrics) {
      const PADDING_TO_STOP_CROPPING = 3; // 3 Pixels: to negate rounding errors which cause text to be cropped
      let padding = this.style.calcPadding() * 2; // multiply padding x 2 for left and right1
      let textWidth = this.textMetrics.width + padding;

      return Math.ceil(textWidth + PADDING_TO_STOP_CROPPING);
    }

    return this._width * (this.style?.pixelDensity ?? 1);
  }

  /**
   * @returns {number}
   */
  get textHeight() {
    if (this.style?.autoResize) {
      return this.style.calcFontSize() * 1.5; // TODO: fix - this is a hack to give the text some padding as there is no accurate (or simple) way to measure the height of text
    }

    return this._height * (this.style?.pixelDensity ?? 1);
  }

  /**
   * @returns {TextMetrics}
   */
  get textMetrics() {
    if (!TextGenerator._scratchCanvasContext || !this.style) {
      return;
    }

    TextGenerator._scratchCanvasContext.font = `${this.style.calcFontSize()}px ${this.style.fontName}`;
    TextGenerator._scratchCanvasContext.fillStyle = `#${this.style.fontColor.toString(16)}`;

    return TextGenerator._scratchCanvasContext.measureText(this.text);
  }

  /**
   * @returns {HTMLCanvasElement}
   */
  get canvas() {
    return this._spriteRegionData?.canvas;
  }

  /**
   * @returns {SpriteRegion}
   */
  get spriteRegion() {
    return this._spriteRegionData;
  }

  toString() {
    return `<TextGenerator>${this.uuid}`;
  }

  static getSpriteSheetGenerator() {
    if (!TextGenerator._spriteSheetGenerator) {
      TextGenerator._spriteSheetGenerator = new DynamicSpriteSheetGenerator();
    }

    return TextGenerator._spriteSheetGenerator;
  }
}
