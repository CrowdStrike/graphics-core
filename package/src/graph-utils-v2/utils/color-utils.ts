import { Color } from '../geom/color';
import { NumberUtils } from './number-utils';

type argb = [number, number, number, number];
export class ColorUtils {
  static _color = new Color();

  /**
   *
   * @param float32Color
   * @param result
   * @returns {*}
   */
  static float32ColorToARGB(float32Color: number, result: number[] = []): argb {
    let a = (float32Color & 0xff000000) >>> 24;
    let r = (float32Color & 0xff0000) >>> 16;
    let g = (float32Color & 0xff00) >>> 8;
    let b = float32Color & 0xff;

    if (result != null) {
      result.length = 0;
      result.push(a);
      result.push(r);
      result.push(g);
      result.push(b);

      return result as argb;
    }

    return [a, r, g, b] as argb;
  }

  static colorValueToHexInt(colorValue: string) {
    ColorUtils._color.setStyle(colorValue);

    return ColorUtils._color.getHex();
  }

  /**
   * @param c
   * @returns {string}
   */
  static componentToHex(c: number) {
    let hex = c.toString(16);

    return hex.length === 1 ? `0${hex}` : hex;
  }

  /**
   *
   * @param argb
   * @returns {string}
   * @constructor
   */
  static RGBToHexString(argb: number[]) {
    return `#${ColorUtils.componentToHex(argb[1] ?? 0)}${ColorUtils.componentToHex(
      argb[2] ?? 0,
    )}${ColorUtils.componentToHex(argb[3] ?? 0)}`;
  }

  /**
   *
   * @param argb
   * @returns {string}
   * @constructor
   */
  static ARGBToHexString(argb: number[]) {
    return `#${ColorUtils.componentToHex(argb[0] ?? 0)}${ColorUtils.componentToHex(
      argb[1] ?? 0,
    )}${ColorUtils.componentToHex(argb[2] ?? 0)}${ColorUtils.componentToHex(argb[3] ?? 0)}`;
  }

  /**
   *
   * @param hexColor
   * @returns {string}
   * @constructor
   */
  static rgbHexToString(hexColor: number) {
    let str = hexColor.toString(16);

    return `#${'00000'.substring(0, 6 - str.length)}${str}`;
  }

  /**
   *
   * @param hexColor
   * @returns {string}
   * @constructor
   */
  static ARGBHexToString(hexColor: number) {
    let str = hexColor.toString(16);

    return `#${'FF00000'.substring(0, 8 - str.length)}${str}`;
  }

  /**
   *
   * @returns {string}
   * @constructor
   */
  static RandomRGBColorString() {
    return `#${ColorUtils.componentToHex(
      NumberUtils.getRandomInt(0, 255),
    )}${ColorUtils.componentToHex(NumberUtils.getRandomInt(0, 255))}${ColorUtils.componentToHex(
      NumberUtils.getRandomInt(0, 255),
    )}`;
  }
}
