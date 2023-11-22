import { LineMeshSettings, VERTEX_LAYOUT_MODE } from './LineMeshSettings';

export class ZigZagLineMeshSettings extends LineMeshSettings {
  xDistance = 6;
  divisions = 61;

  constructor(settings?: ZigZagLineMeshSettings) {
    super(settings);

    if (settings) {
      Object.assign(this, settings);
    }

    this.maxVertices = this.divisions + 2;
    this.drawMode = VERTEX_LAYOUT_MODE.DISTRIBUTE;
  }

  clone() {
    let r = super.clone(new ZigZagLineMeshSettings()) as ZigZagLineMeshSettings;

    r.xDistance = this.xDistance;
    r.divisions = this.divisions;
    r.maxVertices = this.maxVertices;
    r.drawMode = VERTEX_LAYOUT_MODE.DISTRIBUTE;

    return r;
  }
}
