import {
  BitmapData,
  DynamicSpriteSheetGenerator,
  MeshBasicTintMaterial,
  NumberUtils,
  Rectangle,
} from '@crowdstrike/graphics-core';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';
import * as THREE from 'three';
import { Mesh, PlaneGeometry } from 'three';

import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

/**
 * This demo shows how to pack variable size bitmaps into a spritesheet
 * and use them with a THREE.js material.
 */
export class BitmapPackingDemo extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  g = new DynamicSpriteSheetGenerator(1024, 1024);

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);

    this.threeView.camera.position.z = 300;

    for (let counter = 0; counter < 30; counter++) {
      let width = NumberUtils.getRandomInt(20, 120);
      let height = NumberUtils.getRandomInt(10, 90);
      let icon = new BitmapData(width, height, false);

      icon.fillRect(new Rectangle(5, 5, width - 10, height - 10), 0xffffffff * Math.random());

      let region = this.g.requestRegion(icon.width, icon.height);

      if (!region || !region.bitmap || !region.spriteSheet) {
        throw new Error();
      }

      region.bitmap.copyPixels(icon, icon.rect, region.rect);

      let geom = new PlaneGeometry(width, height);

      let mat = new MeshBasicTintMaterial({
        map: region.spriteSheet.texture,
        color: '#ffffff',
        transparent: true,
        side: THREE.DoubleSide,
      });

      region.applyMaterialOffsets(mat);

      let mesh = new Mesh(geom, mat);

      mesh.position.x = region.rect.x;
      mesh.position.y = region.rect.y;

      this.threeView.add(mesh);
    }

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);

    this.threeView.add(cube);
  }

  dispose() {
    super.dispose();
  }

  render() {
    super.render();
  }
}
