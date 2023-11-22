import { ColorUtils } from "../../../graph-utils-v2/utils/color-utils";
/**
 * The ColorTransform class lets you adjust the color values in a display
 * object. The color adjustment or <i>color transformation</i> can be applied
 * to all four channels: red, green, blue, and alpha transparency.
 *
 * <p>When a ColorTransform object is applied to a display object, a new value
 * for each color channel is calculated like this:</p>
 *
 * <ul>
 *   <li>New red value = (old red value * <code>redMultiplier</code>) +
 * <code>redOffset</code></li>
 *   <li>New green value = (old green value * <code>greenMultiplier</code>) +
 * <code>greenOffset</code></li>
 *   <li>New blue value = (old blue value * <code>blueMultiplier</code>) +
 * <code>blueOffset</code></li>
 *   <li>New alpha value = (old alpha value * <code>alphaMultiplier</code>) +
 * <code>alphaOffset</code></li>
 * </ul>
 *
 * <p>If any of the color channel values is greater than 255 after the
 * calculation, it is set to 255. If it is less than 0, it is set to 0.</p>
 *
 * <p>You can use ColorTransform objects in the following ways:</p>
 *
 * <ul>
 *   <li>In the <code>colorTransform</code> parameter of the
 * <code>colorTransform()</code> method of the BitmapData class</li>
 *   <li>As the <code>colorTransform</code> property of a Transform object
 * (which can be used as the <code>transform</code> property of a display
 * object)</li>
 * </ul>
 *
 * <p>You must use the <code>new ColorTransform()</code> constructor to create
 * a ColorTransform object before you can call the methods of the
 * ColorTransform object.</p>
 *
 * <p>Color transformations do not apply to the background color of a movie
 * clip(such as a loaded SWF object). They apply only to graphics and symbols
 * that are attached to the movie clip.</p>
 */

export class ColorTransform {
  /**
   * A decimal value that is multiplied with the alpha transparency channel
   * value.
   *
   * <p>If you set the alpha transparency value of a display object directly by
   * using the <code>alpha</code> property of the DisplayObject instance, it
   * affects the value of the <code>alphaMultiplier</code> property of that
   * display object's <code>transform.colorTransform</code> property.</p>
   */
  alphaMultiplier: number;

  /**
   * A number from -255 to 255 that is added to the alpha transparency channel
   * value after it has been multiplied by the <code>alphaMultiplier</code>
   * value.
   */
  alphaOffset: number;

  /**
   * A decimal value that is multiplied with the blue channel value.
   */
  blueMultiplier: number;

  /**
   * A number from -255 to 255 that is added to the blue channel value after it
   * has been multiplied by the <code>blueMultiplier</code> value.
   */
  blueOffset: number;

  /**
   * A decimal value that is multiplied with the green channel value.
   */
  greenMultiplier: number;

  /**
   * A number from -255 to 255 that is added to the green channel value after
   * it has been multiplied by the <code>greenMultiplier</code> value.
   */
  greenOffset: number;

  /**
   * A decimal value that is multiplied with the red channel value.
   */
  redMultiplier: number;

  /**
   * A number from -255 to 255 that is added to the red channel value after it
   * has been multiplied by the <code>redMultiplier</code> value.
   */
  redOffset: number;

  /**
   * The RGB color value for a ColorTransform object.
   *
   * <p>When you set this property, it changes the three color offset values
   * (<code>redOffset</code>, <code>greenOffset</code>, and
   * <code>blueOffset</code>) accordingly, and it sets the three color
   * multiplier values(<code>redMultiplier</code>,
   * <code>greenMultiplier</code>, and <code>blueMultiplier</code>) to 0. The
   * alpha transparency multiplier and offset values do not change.</p>
   *
   * <p>When you pass a value for this property, use the format
   * 0x<i>RRGGBB</i>. <i>RR</i>, <i>GG</i>, and <i>BB</i> each consist of two
   * hexadecimal digits that specify the offset of each color component. The 0x
   * tells the ActionScript compiler that the number is a hexadecimal
   * value.</p>
   */
  get color(): number {
    return (this.redOffset << 16) | (this.greenOffset << 8) | this.blueOffset;
  }

  set color(value: number) {
    let argb: number[] = ColorUtils.float32ColorToARGB(value);

    this.redOffset = argb[1] as number; // (value >> 16) & 0xFF;
    this.greenOffset = argb[2] as number; // (value >> 8) & 0xFF;
    this.blueOffset = argb[3] as number; // value & 0xFF;

    this.redMultiplier = 0;
    this.greenMultiplier = 0;
    this.blueMultiplier = 0;
  }

  /**
   * Creates a ColorTransform object for a display object with the specified
   * color channel values and alpha values.
   *
   * @param redMultiplier   The value for the red multiplier, in the range from
   *                        0 to 1.
   * @param greenMultiplier The value for the green multiplier, in the range
   *                        from 0 to 1.
   * @param blueMultiplier  The value for the blue multiplier, in the range
   *                        from 0 to 1.
   * @param alphaMultiplier The value for the alpha transparency multiplier, in
   *                        the range from 0 to 1.
   * @param redOffset       The offset value for the red color channel, in the
   *                        range from -255 to 255.
   * @param greenOffset     The offset value for the green color channel, in
   *                        the range from -255 to 255.
   * @param blueOffset      The offset for the blue color channel value, in the
   *                        range from -255 to 255.
   * @param alphaOffset     The offset for alpha transparency channel value, in
   *                        the range from -255 to 255.
   */
  // eslint-disable-next-line max-params
  constructor(
    redMultiplier = 1,
    greenMultiplier = 1,
    blueMultiplier = 1,
    alphaMultiplier = 1,
    redOffset = 0,
    greenOffset = 0,
    blueOffset = 0,
    alphaOffset = 0
  ) {
    this.redMultiplier = redMultiplier;
    this.greenMultiplier = greenMultiplier;
    this.blueMultiplier = blueMultiplier;
    this.alphaMultiplier = alphaMultiplier;
    this.redOffset = redOffset;
    this.greenOffset = greenOffset;
    this.blueOffset = blueOffset;
    this.alphaOffset = alphaOffset;
  }

  /**
   * Concatenates the ColorTranform object specified by the <code>second</code>
   * parameter with the current ColorTransform object and sets the current
   * object as the result, which is an additive combination of the two color
   * transformations. When you apply the concatenated ColorTransform object,
   * the effect is the same as applying the <code>second</code> color
   * transformation after the <i>original</i> color transformation.
   *
   * @param second The ColorTransform object to be combined with the current
   *               ColorTransform object.
   */
  concat(second: ColorTransform): void {
    this.redMultiplier += second.redMultiplier;
    this.greenMultiplier += second.greenMultiplier;
    this.blueMultiplier += second.blueMultiplier;
    this.alphaMultiplier += second.alphaMultiplier;
  }
}
