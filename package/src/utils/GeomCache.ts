import * as THREE from 'three';

import type { PlaneGeometry } from 'three';

export class GeomCache {
  static _geometryCache: Record<string, THREE.PlaneGeometry> = {};

  /**
   * get a cached BoxGeometry object if one is available
   * @returns {THREE.PlaneGeometry}
   */
  static getCachedPlaneGeometry(
    w: number,
    h: number,
    offset = new THREE.Vector3(),
  ): THREE.PlaneGeometry {
    let geom;
    let k = `${w}:${h}:${offset.x}:${offset.y}:${offset.z}`;

    if (GeomCache._geometryCache[k]) {
      geom = GeomCache._geometryCache[k];
    } else {
      geom = new THREE.PlaneGeometry(w, h);
      geom.translate(offset.x, offset.y, offset.z);
      GeomCache._geometryCache[k] = geom;
    }

    return geom as PlaneGeometry;
  }

  static dispose() {
    let keys = Object.keys(GeomCache._geometryCache);
    let len = keys.length;
    let geom;

    for (let c = 0; c < len; c++) {
      geom = GeomCache._geometryCache[keys[c] as string];
      geom?.dispose();
    }

    GeomCache._geometryCache = {};
  }
}
