import * as THREE from 'three';

import { LineMeshSettings } from './LineMeshSettings';

export class ArrowLineMeshSettings extends LineMeshSettings {
  arrowScale = 1; // scale of start / end arrows
  endOffset = 0; // offset of end arrow from position
  endPosition = 1; // percentage of line to position arrow
  handlePosition = 0.5;
  handleScale = new THREE.Vector3(1, 1, 1);
  hasEndArrow = true; // has end arrow
  hasHandle = false; // has handle
  hasStartArrow = true; // has start arrow
  startOffset = 0; // offset of start arrow from position
  startPosition = 1; // percentage of line to position arrow

  constructor(settings?: {
    arrowScale?: number;
    endOffset?: number;
    endPosition?: number;
    handlePosition?: number;
    handleScale?: THREE.Vector3;
    hasEndArrow?: boolean;
    hasHandle?: boolean;
    hasStartArrow?: boolean;
    startOffset?: number;
    startPosition?: number;
  }) {
    super(settings as LineMeshSettings);

    if (settings) {
      Object.assign(this, settings);
    }
  }

  clone() {
    let r = super.clone(new ArrowLineMeshSettings()) as ArrowLineMeshSettings;

    r.arrowScale = this.arrowScale;
    r.endOffset = this.endOffset;
    r.endPosition = this.endPosition;
    r.handlePosition = this.handlePosition;
    r.handleScale = this.handleScale.clone();
    r.hasEndArrow = this.hasEndArrow;
    r.hasHandle = this.hasHandle;
    r.hasStartArrow = this.hasStartArrow;
    r.startOffset = this.startOffset;
    r.startPosition = this.startPosition;

    return r;
  }
}
