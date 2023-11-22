import { ObjectPool } from '../utils/kurst/data/ObjectPool';
import { ObjectPoolInterface } from '../utils/kurst/data/ObjectPoolInterface';
import { MaterialLibrary } from '../utils/MaterialLibrary';

interface LineMaterialPoolSettings {
  lineColor: number;
  lineSettings: {
    shouldUseVertexColors: boolean;
    isDashedLine: boolean;
    dashSize: number;
    gapSize: number;
  };
}

export class LineMaterialPool extends ObjectPoolInterface<THREE.LineBasicMaterial> {
  settings: LineMaterialPoolSettings;
  constructor(
    lineColor: number,
    { shouldUseVertexColors = false, isDashedLine = false, dashSize = 3, gapSize = 1 },
    { size = 25, resize = 50 } = {},
  ) {
    super();

    this.settings = {
      lineColor,
      lineSettings: { shouldUseVertexColors, isDashedLine, dashSize, gapSize },
    };

    this.pool = new ObjectPool(
      () => this.createMaterial(),
      (o) => this.disposeMaterial(o),
      size,
      resize,
    );
  }

  createMaterial() {
    let { lineColor, lineSettings } = this.settings;

    return MaterialLibrary.createNewLineMaterial(lineColor, lineSettings);
  }

  disposeMaterial(o: THREE.LineBasicMaterial): THREE.LineBasicMaterial {
    o.dispose();

    return o;
  }
}
