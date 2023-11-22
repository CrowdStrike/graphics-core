import { Random } from './random';

export class NumberUtils {
  static psrnd = false;
  static rnd = new Random();

  static seed(seed = 1, flag = true) {
    NumberUtils.psrnd = flag;
    NumberUtils.rnd.seed(seed);
  }

  /**
   * Random integer
   *
   * @param min
   * @param max
   * @returns {number}
   */
  static getRandomInt(min: number, max: number) {
    return NumberUtils.psrnd
      ? Math.floor(NumberUtils.rnd.next() * (max - min + 1)) + min
      : Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * flipWeightedCoin
   *
   * @param percentage -  weight percentage, if random value is less than coin will return true.
   *            A percentage of .5 will return true 50% of the time whereas a percentage value of 25% will
   *            only return tru 25% of the time.
   * @returns {boolean}
   */
  static flipWeightedCoin(percentage: number) {
    return NumberUtils.random(0, 1) <= percentage;
  }

  /**
   * Flip coins
   *
   * @returns {boolean}
   */
  static flipCoin() {
    return NumberUtils.getRandomInt(0, 2) <= 1;
  }

  /**
   * random number ( between min / max )
   * @param low
   * @param high
   * @returns {any}
   */
  static random(low = 0, high = 1) {
    if (low === 0 && high === 1) {
      return NumberUtils.psrnd ? NumberUtils.rnd.next() : Math.random();
    }

    if (low >= high) {
      return low;
    }

    let diff = high - low;

    return NumberUtils.psrnd ? NumberUtils.rnd.next() * diff + low : Math.random() * diff + low;
  }

  /**
   * constrain number
   *
   * @param v
   * @param min
   * @param max
   * @returns {any}
   */
  static constrain(v: number, min: number, max: number) {
    if (v < min) {
      v = min;
    } else if (v > max) {
      v = max;
    }

    return v;
  }

  /**
   * convert decimal value to Hex
   * @param d
   * @param padding
   * @returns {string}
   */
  static decimalToHex(d: number, padding = 2) {
    let hex = d.toString(16).toUpperCase();

    while (hex.length < padding) {
      hex = `0${hex}`;
    }

    return hex;
  }

  /**
   * convert rgb( 12, 213, 123 ) to hex
   * @param rgb
   * @returns {string}
   */
  static rgbToHex(rgb: string) {
    let rgbRegex = /^rgb\(\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*\)$/;
    let result;
    let r;
    let g;
    let b;
    let hex = '';

    if ((result = rgbRegex.exec(rgb))) {
      if (result[1] === undefined || result[3] === undefined || result[5] === undefined) {
        return undefined;
      }

      r = NumberUtils.componentFromStr(result[1], Number(result[2]));
      g = NumberUtils.componentFromStr(result[3], Number(result[4]));
      b = NumberUtils.componentFromStr(result[5], Number(result[6]));
      hex = `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    return hex;
  }

  /**
   *
   * @param numStr
   * @param percent
   * @returns {number}
   */
  static componentFromStr(numStr: string, percent: number) {
    let num = Math.max(0, parseInt(numStr, 10));

    return percent ? Math.floor((255 * Math.min(100, num)) / 100) : Math.min(255, num);
  }

  /**
   *
   * @param degrees
   * @returns {number}
   */
  static degToRad(degrees: number) {
    return degrees * (Math.PI / 180);
  }

  /**
   *
   * @param rad
   * @returns {number}
   */
  static radToDeg(rad: number) {
    return rad * (180 / Math.PI);
  }

  /**
   * round up or down to the very nearest power of two
   * @param value
   * @returns {number}
   */
  static nearestPowerOfTwo(value: number) {
    return Math.pow(2, Math.round(Math.log(value) / Math.LN2));
  }

  /**
   * Round UP to the nearest power of two
   * @param value
   * @returns {number}
   */
  static roundupNearestPowerOfTwo(value: number) {
    return Math.pow(2, Math.ceil(Math.log(value) / Math.log(2)));
  }

  static isNear(source: number, target: number, rad: number) {
    return source - rad < target && source + rad > target;
  }

  /**
   * Generate UUID
   *
   * @returns {string}
   */
  static generateUUID() {
    // http://www.broofa.com/Tools/Math.uuid.htm

    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    let uuid = new Array(36);
    let rnd = 0;
    let r;

    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid[i] = '-';
      } else if (i === 14) {
        uuid[i] = '4';
      } else {
        if (rnd <= 0x02) {
          rnd = (0x2000000 + Math.random() * 0x1000000) | 0;
        }

        r = rnd & 0xf;
        rnd = rnd >> 4;
        uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r];
      }
    }

    return uuid.join('');
  }

  /**
   * return inverse scaled value
   * @param d : number - value
   * @param s : number - scale
   * @returns {number}
   */
  static inverseScale(d: number, s: number) {
    return d - d * s;
  }

  /**
   * sort string numbers in ascending order
   * @param a : string
   * @param b : string
   */
  static sortCompareStringNumber(a: string, b: string) {
    // +('2') converts string to number (and is faster than parseInt);
    return +a - +b;
  }

  /**
   * normalize a value
   * @param val
   * @param min
   * @param delta
   * @return {number}
   */
  static normalize(val: number, min: number, delta: number) {
    return (val - min) / delta;
  }

  /**
   * remaps one numerical range to another
   * @param value
   * @param min1
   * @param max1
   * @param min2
   * @param max2
   * @returns {number}
   */
  static remap(value: number, min1: number, max1: number, min2: number, max2: number) {
    return NumberUtils.clamp(min2 + ((value - min1) * (max2 - min2)) / (max1 - min1), min2, max2);
  }

  /**
   * clamps a given number to the [min, max] spectrum
   * @param value
   * @param min
   * @param max
   * @returns
   */
  static clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }
}
