import { Rectangle } from '../geom/Rectangle';

export interface Fit {
  down?: Fit;
  h: number;
  right?: Fit;
  used?: boolean;
  w: number;
  x: number;
  y: number;
}

/**
 * Packer Block
 */
export class Block extends Rectangle {
  fit: Fit | null;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    super(x, y, width, height);
    this.fit = null;
  }

  get w() {
    return this.width;
  }

  set w(v) {
    this.width = v;
  }

  get h() {
    return this.height;
  }

  set h(v) {
    this.height = v;
  }
}
