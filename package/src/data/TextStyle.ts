/**
 * Text style for the text generator
 */
import { NumberUtils } from "../graph-utils-v2/utils/number-utils";

export class TextStyle {
  static ALIGN_LEFT = "left-align";
  static ALIGN_RIGHT = "right-align";
  static ALIGN_CENTER = "center-align";
  static ALIGN_NONE = "none";

  _idc = NumberUtils.generateUUID();
  alignment = TextStyle.ALIGN_LEFT;
  autoResize = true;
  backgroundColor?: number; // 0x4400ffff; // Good colour for debugging text
  fontColor = 0x111111;
  fontName = "Calibre";
  fontSize = 12;
  name = "";
  padding = 0;
  pixelDensity = 1;

  constructor(params?: Record<string, unknown>) {
    if (params !== undefined) {
      Object.keys(params).forEach((key) => {
        (this as Record<string, unknown>)[key] = params[key];
      });
    }
  }

  dispose() {
    this._idc = "";
    this.alignment = "";
    this.backgroundColor = undefined;
    this.fontName = "";
    this.name = "";
    this.padding = 0;
    this.pixelDensity = 1;
  }


  clone() {
    let s = new TextStyle();

    s.alignment = this.alignment;
    s.autoResize = this.autoResize;
    s.backgroundColor = this.backgroundColor;
    s.fontColor = this.fontColor;
    s.fontName = this.fontName;
    s.fontSize = this.fontSize;
    s.name = `${this.name} clone`;
    s.padding = this.padding;
    s.pixelDensity = this.pixelDensity;

    return s;
  }

  /**
   * Calculate font size taking pixel density into account
   * @returns {number}
   */
  calcFontSize() {
    return this.fontSize * this.pixelDensity;
  }

  /**
   * Calculate padding taking pixel density into account
   * @returns {number}
   */
  calcPadding() {
    return this.padding * this.pixelDensity;
  }

  /**
   * @returns {string|*}
   */
  toString() {
    return `<TextStyle>${this._idc}`;
  }
}
