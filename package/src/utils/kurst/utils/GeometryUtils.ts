import type { Point } from '../geom/Point';
import type { Rectangle } from '../geom/Rectangle';
import type * as THREE from 'three';

export class GeometryUtils {
  static distancePointToRectangle(point: Point | THREE.Vector2, rect: Rectangle) {
    let xDist = GeometryUtils.minXDistance(point, rect);
    let yDist = GeometryUtils.minYDistance(point, rect);

    if (xDist === 0) {
      return yDist;
    } else if (yDist === 0) {
      return xDist;
    }

    return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
  }

  static minXDistance(point: Point | THREE.Vector2, rect: Rectangle) {
    if (rect.left > point.x) {
      return rect.left - point.x;
    } else if (rect.right < point.x) {
      return point.x - rect.right;
    } else {
      return 0;
    }
  }

  static minYDistance(point: Point | THREE.Vector2, rect: Rectangle) {
    if (rect.bottom < point.y) {
      return point.y - rect.bottom;
    } else if (rect.top > point.y) {
      return rect.top - point.y;
    } else {
      return 0;
    }
  }
}
