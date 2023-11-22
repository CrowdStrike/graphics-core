import { Color, CubicBezierCurve3, Vector3 } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';

export class LineV2Skeleton extends Line2 {
  private _start: Vector3 = new Vector3();
  private _end: Vector3 = new Vector3();
  private _color: Color = new Color(0xff0000);
  private _positions: number[] = [];
  private _colors: number[] = [];

  constructor() {
    super();
    this.material.vertexColors = true;
  }

  get color() {
    return this._color;
  }

  get start() {
    return this._start;
  }

  set start(v) {
    this._start.set(v.x, v.y, v.z);
  }

  get end() {
    return this._end;
  }

  set end(v) {
    this._end.set(v.x, v.y, v.z);
  }

  public update() {
    const curve = new CubicBezierCurve3(this.start, new Vector3(), new Vector3(), this.end);
    const points = curve.getPoints(150);

    this._colors.length = 0;
    this._positions.length = 0;

    points.forEach((v) => {
      this._positions.push(v.x, v.y, v.z);
      this._colors.push(this._color.r, this._color.g, this._color.b);
    });

    this.geometry.setPositions(this._positions);
    this.geometry.setColors(this._colors);
    this.computeLineDistances();
  }
}
