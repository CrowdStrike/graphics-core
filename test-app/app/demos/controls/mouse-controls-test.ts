import {
  BitmapComposer,
  Event,
  IconDefinition,
  IconGenerator,
  MouseControls,
  MousePickerEvents,
  MouseUtils,
  ObjectPool,
  ObjectPoolInterface,
  TextureAtlasLoader,
} from '@crowdstrike/graphics-core';
import atlasTextureURL from 'test-app-for-graphics-core/assets/indicators.png';
import spritesMap from 'test-app-for-graphics-core/utils/indicators';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';

import type { Atlas, IconMesh } from '@crowdstrike/graphics-core';
import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class IconMeshPool extends ObjectPoolInterface<IconMesh> {
  iconDefinition: IconDefinition;

  constructor({ iconDefinition }: { iconDefinition: IconDefinition }) {
    super();
    this.iconDefinition = iconDefinition;
    this.pool = new ObjectPool<IconMesh>(
      () => this.createNode(),
      (o) => this.disposeNode(o),
      50,
      50,
    );
  }

  createNode() {
    return IconGenerator.make(this.iconDefinition);
  }

  disposeNode(o: IconMesh) {
    o.dispose();

    return o;
  }
}

export class MouseControlsTest extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  _atlasLoader: TextureAtlasLoader;
  iconPool: IconMeshPool | null;
  icons: IconMesh[];
  mouseControls: MouseControls;

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);
    this._atlasLoader = new TextureAtlasLoader();
    this._atlasLoader.addEventListener(Event.COMPLETE, this._onTextureAtlasLoaded, this);

    this.iconPool = null;
    this.icons = [];
    this.loadAtlas(atlasTextureURL, spritesMap);

    this.threeView.shouldUseTrackBall = false;

    if (this.threeView.trackballControls) {
      this.threeView.trackballControls.enabled = false;
      this.threeView.trackballControls.dispose();
      this.threeView.trackballControls = null as never;
    }

    this.threeView.camera.position.z = 110;

    this.mouseControls = new MouseControls({
      threeView: this.threeView,
      object3DContainer: this.threeView.container,
      shouldDoubleRender: true,
      maxScale: 2.5,
      minScale: 0.25,
    });
    this.mouseControls.throwDampingFactor = 0.1;
    this.mouseControls.throwThreshold = 2;

    this.threeView.mousePicker.addEventListener(MousePickerEvents.ROLL_OUT, this._onRollOut, this);
    this.threeView.mousePicker.addEventListener(
      MousePickerEvents.ROLL_OVER,
      this._onRollOver,
      this,
    );
  }

  loadAtlas(url: string, atlas: Atlas) {
    this._atlasLoader.load(atlas, url);
  }

  _onRollOut() {
    MouseUtils.rollout();
  }

  _onRollOver() {
    MouseUtils.rollover();
  }

  _onTextureAtlasLoaded() {
    let iconDefinition = new IconDefinition(this._atlasLoader);

    iconDefinition.addLayer({
      asset: 'indicator-icon-background@2.5x',
      color: 0x000000,
    });
    iconDefinition.addLayer({
      asset: 'ip-icon@2.5x',
      color: 0x999999,
    });

    this.iconPool = new IconMeshPool({ iconDefinition });

    let total = 99;
    let row = 0;
    let column = 0;
    let cellWidth = 35;
    let colWidth = 10;
    let totalWidth = cellWidth * (colWidth - 1);

    while (total--) {
      if (column > colWidth) {
        row++;
        column = 0;
      }

      let iconMesh = this.iconPool.pop();

      iconMesh.scale.set(0.18, 0.18, 0.18);

      let x = column * cellWidth - totalWidth / 2;
      let y = row * cellWidth - totalWidth / 2;

      iconMesh.position.set(x, y, 0);
      iconMesh.geometry.computeBoundingSphere();
      this.icons.push(iconMesh);
      this.threeView.add(iconMesh);

      column++;
    }
  }

  dispose() {
    this.mouseControls.dispose();
    this.icons.forEach((icon) => {
      this.threeView.remove(icon);
      this.icons.push(icon);
    });

    if (this.iconPool) {
      this.iconPool.dispose();
    }

    this._atlasLoader.dispose();
    BitmapComposer.dispose();
    super.dispose();
  }

  render() {
    super.render();
    this.mouseControls.render();
  }
}
