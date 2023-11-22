import * as THREE from 'three';

import { LabelGenerator } from '../generators/LabelGenerator';
import { MaterialLibrary } from '../utils/MaterialLibrary';

import type { TextStyle } from '../data/TextStyle';
import type { LabelMesh } from '../objects/LabelMesh';
import type { Camera } from 'three/src/cameras/Camera';
import type { BufferGeometry } from 'three/src/core/BufferGeometry';
import type { Material } from 'three/src/materials/Material';
import type { Group } from 'three/src/objects/Group';
import type { WebGLRenderer } from 'three/src/renderers/WebGLRenderer';
import type { Scene } from 'three/src/scenes/Scene';

export class NodeMesh extends THREE.Mesh {
  defaultLabelScale = 0.25;
  isCameraFacing = false;
  label: undefined | LabelMesh = LabelGenerator.make(
    '',
    MaterialLibrary.getNodeTextStyle('#000000'),
  );

  constructor(geometry?: BufferGeometry, material?: Material | Material[]) {
    super(geometry, material);
    this.defaultLabelScale = 0.25;
    this.isCameraFacing = false;

    if (!this.label) {
      throw new Error('NodeMesh label should not be undefined');
    }

    this.label.isCameraFacing = false;

    if (!Array.isArray(this.label.material)) {
      this.label.material.transparent = true;
    }

    this.label.scale.set(this.defaultLabelScale, this.defaultLabelScale, this.defaultLabelScale);
    this.label.position.set(0, 11, 0);
    this.add(this.label);
  }

  setText(text: string, style: TextStyle) {
    if (!this.label) {
      throw new Error('NodeMesh label should not be undefined');
    }

    LabelGenerator.update(this.label, text, style);
  }

  setLabelScale(scalar: number) {
    this.label?.scale.set(scalar, scalar, scalar);
  }

  // eslint-disable-next-line max-params
  onBeforeRender = (
    renderer: WebGLRenderer,
    scene: Scene,
    camera: Camera,
    geometry: BufferGeometry,
    material: Material,
    group: Group,
    // eslint-disable-next-line max-params
  ) => {
    super.onBeforeRender(renderer, scene, camera, geometry, material, group);

    if (this.isCameraFacing) {
      this.quaternion.copy(camera.quaternion);
    }
  };

  dispose() {
    if (this.label?.parent) {
      this.remove(this.label);
      this.label.dispose();
    }

    this.label = undefined;
  }
}
