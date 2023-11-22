import { NumberUtils } from './number-utils';

export class ArrayUtils {
  /**
   * copy target array to source array
   *
   * @param target
   * @param source
   */
  static copyTo(target: unknown[], source: unknown[]) {
    // Optimized for performance
    target.push.apply(target, source); // eslint-disable-line prefer-spread
  }

  /**
   * normalize an Array of numbers
   * @param array
   * @return {Array}
   */
  static normalize(array: number[]) {
    let min = Math.min(...array);
    let max = Math.max(...array);
    let delta = max - min;

    return array.map((v) => NumberUtils.normalize(v, min, delta));
  }

  /**
   * Shuffle an array
   * @param a
   */
  static shuffle(a: unknown[]) {
    let j;
    let x;
    let i;

    for (i = a.length; i; i -= 1) {
      j = Math.floor(Math.random() * i);
      x = a[i - 1];
      a[i - 1] = a[j];
      a[j] = x;
    }

    return a;
  }
}
