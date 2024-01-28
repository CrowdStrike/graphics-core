/**
 * This is a thin wrapper around the
 * LineV2/LineBezier2/LineBezier3 classes
 *
 * It performs state updates based on diffing
 */

import { LineBezier2 } from '../../objects/lines-v2/line-bezier2';
import { LineBezier3 } from '../../objects/lines-v2/line-bezier3';

import type { LineV2, LineV2Settings } from '../../objects/lines-v2/line-base';
import type { QuadraticBezierCurve3 } from 'three';

/**
 * This class reacts to state changes and dispatches property updates
 * accordingly, regardless of which line we're using
 */
export class GraphicsV2EdgeController<
  LineV2Type extends LineV2 | LineBezier2<QuadraticBezierCurve3>,
  S extends LineV2Settings,
> {
  /**
   * this.state is being used by GraphicsV2EdgeController,
   * in order to diff state and apply partial updates to line parameters.
   */
  declare state: S;
  declare line: LineV2Type;

  // TODO fix type here
  constructor({ line }: { line: LineV2Type }) {
    this.line = line;
    this.state = this.line.settings as S;
  }

  dispose() {
    this.line.dispose();
  }

  get start() {
    return this.line.start;
  }

  get end() {
    return this.line.end;
  }

  updateConfig(state: S) {
    // diff the two different configurations
    const stateDiff = Object.keys(this.state).reduce<S>((acc, curr) => {
      if ('endColor' in state) {
        acc['endColor'] = state['endColor'];
      }

      let current = curr as keyof S;

      if (state[current] && this.state[current] !== state[current]) {
        acc[current] = state[current];
      }

      return acc;
    }, {} as S);

    Object.entries(stateDiff).forEach(([key, value]) => {
      switch (key) {
        case 'color':
          if (typeof value === 'number') {
            this.state.color = value;
            this.line.setColor(value, this.line.endColor);
          }

          break;
        case 'endColor':
          if (typeof value === 'number') {
            this.state.endColor = value;
            this.line.setColor(this.line.color, value);
          }

          break;
        case 'label':
          if (typeof value === 'string') {
            this.state.label = value;
            this.line.setLabel(value);
          }

          break;
        case 'labelColor':
          if (typeof value === 'number') {
            this.line.setLabelColor(value);
          }

          break;
        case 'startWidth':
          if (typeof value === 'number') {
            this.state.startWidth = value;
            this.line.setLineWidths(value, this.line.endLineWidth);
          }

          break;
        case 'endWidth':
          if (typeof value === 'number') {
            this.state.endWidth = value;
            this.line.setLineWidths(this.line.lineWidth, value);
          }

          break;
        case 'startArrowPosition':
          if (typeof value === 'number') {
            this.state.startArrowPosition = value;
            this.line.startArrowPosition = value;
          }

          break;
        case 'endArrowPosition':
          if (typeof value === 'number') {
            this.state.endArrowPosition = value;
            this.line.endArrowPosition = value;
          }

          break;
        default:
          break;
      }
    });

    // TODO Optimize here for what kind of update should be performed
    // (should the curve update or not?)
    // and is it the responsibility of this method to handle the update?
  }

  update() {
    let shouldUpdateCurve = false;

    // if this.start is coplanar to this.end, collapse control points
    if (this.isLineCoplanarOnX() || this.isLineCoplanarOnY()) {
      if (this.line instanceof LineBezier2) {
        this.line.setControlPoint1Offsets(0, this.line._controlPoint1IntersectsLineAt);
        shouldUpdateCurve = true;

        if (this.line instanceof LineBezier3) {
          this.line.setControlPoint2Offsets(1, this.line._controlPoint2IntersectsLineAt);
          shouldUpdateCurve = true;
        }
      }
    }

    if (isLineCurve(this.line) && shouldUpdateCurve) {
      this.line.update(true);
    } else {
      this.line.update();
    }
  }

  private isLineCoplanarOnAxis(axis: 'x' | 'y') {
    return this.line.start.getComponent(axis === 'x' ? 0 : 1) === this.line.end.getComponent(axis === 'x' ? 0 : 1);
  }

  isLineCoplanarOnX() {
    return this.isLineCoplanarOnAxis('x');
  }

  isLineCoplanarOnY() {
    return this.isLineCoplanarOnAxis('y');
  }

  isLineCoplanar() {
    return this.isLineCoplanarOnX() || this.isLineCoplanarOnY();
  }
}

function isLineCurve(line: LineV2 | LineBezier2 | LineBezier3): line is LineBezier2 | LineBezier3 {
  return line instanceof LineBezier2 || line instanceof LineBezier3;
}
