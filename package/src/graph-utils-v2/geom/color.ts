interface HSL {
  h: number;
  s: number;
  l: number;
}
export class Color {
  static random(): string {
    return '#' + (((1 << 24) * Math.random()) | 0).toString(16);
  }

  r = 1;
  g = 1;
  b = 1;

  constructor(r?: number, g?: number, b?: number) {
    if (r != null && g != null && b != null) {
      this.setRGB(r, g, b);
    }
  }

  /**
   *
   * @param value
   * @returns {Color}
   */
  set(value: Color | number | string): Color {
    if (value instanceof Color) {
      this.copy(value);
    } else if (typeof value === 'number') {
      this.setHex(value);
    } else if (typeof value === 'string') {
      this.setStyle(value);
    }

    return this;
  }

  /**
   *
   * @param hex
   * @returns {Color}
   */
  setHex(hex: number): Color {
    hex = Math.floor(hex);

    this.r = ((hex >> 16) & 255) / 255;
    this.g = ((hex >> 8) & 255) / 255;
    this.b = (hex & 255) / 255;

    return this;
  }

  /**
   *
   * @param r
   * @param g
   * @param b
   * @returns {Color}
   */
  setRGB(r: number, g: number, b: number): Color {
    this.r = r;
    this.g = g;
    this.b = b;

    return this;
  }

  /**
   *
   * @param h
   * @param s
   * @param l
   * @returns {Color}
   */
  setHSL(h: number, s: number, l: number): Color {
    // h,s,l ranges are in 0.0 - 1.0

    if (s === 0) {
      this.r = this.g = this.b = l;
    } else {
      let hue2rgb = function (p: number, q: number, t: number) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);

        return p;
      };

      let p = l <= 0.5 ? l * (1 + s) : l + s - l * s;
      let q = 2 * l - p;

      this.r = hue2rgb(q, p, h + 1 / 3);
      this.g = hue2rgb(q, p, h);
      this.b = hue2rgb(q, p, h - 1 / 3);
    }

    return this;
  }

  /**
   *
   * @param style
   * @returns {Color}
   */
  setStyle(style: string): Color | undefined {
    // rgb(255,0,0)
    /* eslint-disable no-useless-escape */
    if (/^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.test(style)) {
      let color = /^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.exec(style);

      if (color) {
        if (color[1] === undefined || color[2] === undefined || color[3] === undefined) {
          return undefined;
        }

        this.r = Math.min(255, parseInt(color[1], 10)) / 255;
        this.g = Math.min(255, parseInt(color[2], 10)) / 255;
        this.b = Math.min(255, parseInt(color[3], 10)) / 255;
      }

      return this;
    }

    // rgb(100%,0%,0%)

    if (/^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.test(style)) {
      let color = /^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.exec(style);

      if (color) {
        if (color[1] === undefined || color[2] === undefined || color[3] === undefined) {
          return undefined;
        }

        this.r = Math.min(100, parseInt(color[1], 10)) / 100;
        this.g = Math.min(100, parseInt(color[2], 10)) / 100;
        this.b = Math.min(100, parseInt(color[3], 10)) / 100;
      }

      return this;
    }

    // #ff0000

    if (/^\#([0-9a-f]{6})$/i.test(style)) {
      let color = /^\#([0-9a-f]{6})$/i.exec(style);

      if (color?.[1]) {
        this.setHex(parseInt(color[1], 16));
      }

      return this;
    }

    // #f00

    if (/^\#([0-9a-f])([0-9a-f])([0-9a-f])$/i.test(style)) {
      let color = /^\#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(style);

      if (color) {
        if (color[1] === undefined || color[2] === undefined || color[3] === undefined) {
          return undefined;
        }

        this.setHex(parseInt(color[1] + color[1] + color[2] + color[2] + color[3] + color[3], 16));
      }

      return this;
    }

    return undefined;
    /* eslint-enable no-useless-escape */
  }

  /**
   *
   * @param color
   * @returns {Color}
   */
  copy(color: Color): Color {
    this.r = color.r;
    this.g = color.g;
    this.b = color.b;

    return this;
  }

  /**
   *
   * @param color
   * @returns {Color}
   */
  copyGammaToLinear(color: Color): Color {
    this.r = color.r * color.r;
    this.g = color.g * color.g;
    this.b = color.b * color.b;

    return this;
  }

  /**
   *
   * @param color
   * @returns {Color}
   */
  copyLinearToGamma(color: Color): Color {
    this.r = Math.sqrt(color.r);
    this.g = Math.sqrt(color.g);
    this.b = Math.sqrt(color.b);

    return this;
  }

  /**
   *
   * @returns {Color}
   */
  convertGammaToLinear(): Color {
    let { r } = this;

    let { g } = this;

    let { b } = this;

    this.r = r * r;
    this.g = g * g;
    this.b = b * b;

    return this;
  }

  /**
   *
   * @returns {Color}
   */
  convertLinearToGamma(): Color {
    this.r = Math.sqrt(this.r);
    this.g = Math.sqrt(this.g);
    this.b = Math.sqrt(this.b);

    return this;
  }

  /**
   *
   * @returns {number}
   */
  getHex(): number {
    return ((this.r * 255) << 16) ^ ((this.g * 255) << 8) ^ ((this.b * 255) << 0);
  }

  /**
   *
   * @returns {string}
   */
  getHexString(): string {
    return ('000000' + this.getHex().toString(16)).slice(-6);
  }

  /**
   *
   * @param optionalTarget
   * @returns {any|{h: number, s: number, l: number}}
   */
  getHSL(optionalTarget?: HSL): HSL {
    // h,s,l ranges are in 0.0 - 1.0

    let hsl = (optionalTarget || { h: 0, s: 0, l: 0 }) as HSL;

    let { r } = this;

    let { g } = this;

    let { b } = this;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);

    let hue;
    let saturation;
    let lightness = (min + max) / 2.0;

    if (min === max) {
      hue = 0;
      saturation = 0;
    } else {
      let delta = max - min;

      saturation = lightness <= 0.5 ? delta / (max + min) : delta / (2 - max - min);

      switch (max) {
        case r:
          hue = (g - b) / delta + (g < b ? 6 : 0);

          break;
        case g:
          hue = (b - r) / delta + 2;

          break;
        case b:
          hue = (r - g) / delta + 4;

          break;
      }

      if (hue !== undefined) {
        hue /= 6;
      }
    }

    hsl.h = hue !== undefined ? hue : 0;
    hsl.s = saturation;
    hsl.l = lightness;

    return hsl;
  }

  /**
   *
   * @returns {string}
   */
  getStyle(): string {
    return (
      'rgb(' + ((this.r * 255) | 0) + ',' + ((this.g * 255) | 0) + ',' + ((this.b * 255) | 0) + ')'
    );
  }

  /**
   *
   * @param h
   * @param s
   * @param l
   * @returns {Color}
   */
  offsetHSL(h: number, s: number, l: number): Color {
    let hsl = this.getHSL();

    hsl.h += h;
    hsl.s += s;
    hsl.l += l;

    this.setHSL(hsl.h, hsl.s, hsl.l);

    return this;
  }

  /**
   *
   * @param color
   * @returns {Color}
   */
  add(color: Color): Color {
    this.r += color.r;
    this.g += color.g;
    this.b += color.b;

    return this;
  }

  /**
   *
   * @param color1
   * @param color2
   * @returns {Color}
   */
  addColors(color1: Color, color2: Color): Color {
    this.r = color1.r + color2.r;
    this.g = color1.g + color2.g;
    this.b = color1.b + color2.b;

    return this;
  }

  /**
   *
   * @param s
   * @returns {Color}
   */
  addScalar(s: number): Color {
    this.r += s;
    this.g += s;
    this.b += s;

    return this;
  }

  /**
   *
   * @param color
   * @returns {Color}
   */
  multiply(color: Color): Color {
    this.r *= color.r;
    this.g *= color.g;
    this.b *= color.b;

    return this;
  }

  /**
   *
   * @param s
   * @returns {Color}
   */
  multiplyScalar(s: number): Color {
    this.r *= s;
    this.g *= s;
    this.b *= s;

    return this;
  }

  /**
   *
   * @param color
   * @param alpha
   * @returns {Color}
   */
  lerp(color: Color, alpha: number): Color {
    this.r += (color.r - this.r) * alpha;
    this.g += (color.g - this.g) * alpha;
    this.b += (color.b - this.b) * alpha;

    return this;
  }

  /**
   *
   * @param c
   * @returns {boolean}
   */
  equals(c: Color): boolean {
    return c.r === this.r && c.g === this.g && c.b === this.b;
  }

  /**
   *
   * @returns {Color}
   */
  clone(): Color {
    return new Color().setRGB(this.r, this.g, this.b);
  }
}
