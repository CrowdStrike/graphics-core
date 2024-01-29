import { Event, NumberUtils, TextureAtlasLoader } from '@crowdstrike/graphics-core';
import atlasTextureURL from 'test-app-for-graphics-core/assets/indicators.png';
import spritesMap from 'test-app-for-graphics-core/utils/indicators';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';
import * as THREE from 'three';

import type { Atlas } from '@crowdstrike/graphics-core';
import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class TextureAtlasLoaderTest extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  _atlasLoader: TextureAtlasLoader;

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);
    this.threeView.camera.position.z = 300;
    this._atlasLoader = new TextureAtlasLoader();
    this._atlasLoader.addEventListener(Event.COMPLETE, this._onTextureAtlasLoaded, this);

    this.loadAtlas(atlasTextureURL, spritesMap);
  }

  loadAtlas(url: string, atlas: Atlas) {
    this._atlasLoader.load(atlas, url);
  }

  _onTextureAtlasLoaded() {
    let atlasMaterialsEnum = this._atlasLoader.enum();

    atlasMaterialsEnum.forEach((materialName) => {
      let rect = this._atlasLoader.getTextureSize(materialName);
      let material = this._atlasLoader.getMaterial(materialName);
      let geometry = new THREE.PlaneGeometry(rect.width / 4, rect.height / 4);
      let plane = new THREE.Mesh(geometry, material);

      plane.position.x = NumberUtils.random(-50, 50);
      plane.position.y = NumberUtils.random(-50, 50);
      plane.position.z = NumberUtils.random(-50, 50);
      this.threeView.add(plane);
    });
  }

  dispose() {
    super.dispose();
  }

  render() {
    super.render();
  }
}
