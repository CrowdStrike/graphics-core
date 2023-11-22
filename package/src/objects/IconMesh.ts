import * as THREE from 'three';

import type { BitmapComposer } from '../textures/graphics/BitmapComposer';
import type { Camera } from 'three/src/cameras/Camera';
import type { BufferGeometry } from 'three/src/core/BufferGeometry';
import type { Material } from 'three/src/materials/Material';
import type { Group } from 'three/src/objects/Group';
import type { WebGLRenderer } from 'three/src/renderers/WebGLRenderer';
import type { Scene } from 'three/src/scenes/Scene';

export class IconMesh extends THREE.Mesh {
  public isCameraFacing = false;
  public bitmapComposer?: BitmapComposer;

  constructor(geometry?: BufferGeometry, material?: Material | Material[]) {
    super(geometry, material);
    this.isCameraFacing = false;
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
    this.bitmapComposer = undefined;
  }

  get width() {
    return this.bitmapComposer?.width;
  }

  get height() {
    return this.bitmapComposer?.height;
  }
}
