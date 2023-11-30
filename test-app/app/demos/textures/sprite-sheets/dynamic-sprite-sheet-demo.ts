import {
  BitmapComposer,
  Event,
  IconDefinition,
  IconGenerator,
  LabelGenerator,
  NumberUtils,
  TextStyle,
  TextureAtlasLoader,
} from '@crowdstrike/graphics-core';
import atlasTextureURL from 'test-app-for-graphics-core/assets/indicators.png';
import spritesMap from 'test-app-for-graphics-core/utils/indicators';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';

import type { Atlas, IconMesh, LabelMesh } from '@crowdstrike/graphics-core';
import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class DynamicSpriteSheetDemo extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  _atlasLoader: TextureAtlasLoader;
  textArray: LabelMesh[];
  iconArray: IconMesh[];
  label?: LabelMesh;

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);
    this.threeView.camera.position.z = 300;
    this._atlasLoader = new TextureAtlasLoader();
    this._atlasLoader.addEventListener(Event.COMPLETE, this._onTextureAtlasLoaded, this);

    this.iconArray = [];
    this.textArray = [];
    this.loadAtlas(atlasTextureURL, spritesMap);
  }

  loadAtlas(url: string, atlas: Atlas) {
    this._atlasLoader.load(atlas, url);
  }

  _onTextureAtlasLoaded() {
    let oneStyle = new TextStyle();

    oneStyle.name = 'one-style-name';
    oneStyle.fontSize = 240;
    oneStyle.fontColor = 0x000000;
    oneStyle.fontName = 'Calibre';
    this.textArray.push(LabelGenerator.make('...Unique sprite: with a lot of text...', oneStyle));
    this.textArray.push(LabelGenerator.make('...Unique sprite: with a lot of text...', oneStyle));
    this.textArray.push(LabelGenerator.make('...Unique sprite: with a lot of text...', oneStyle));
    this.textArray.push(LabelGenerator.make('...Unique sprite: with a lot of text...', oneStyle));

    let numberOfLabels = 120;

    while (numberOfLabels--) {
      let style = new TextStyle();

      style.name = 'style-name';
      style.fontSize = 60 * Math.random();
      style.fontColor = 0xffffff * Math.random();
      style.backgroundColor = 0xffffffff * Math.random();
      style.fontName = 'sans-serif';
      this.label = LabelGenerator.make(`${NumberUtils.generateUUID().slice(0, 10)}`, style);
      this.textArray.push(this.label);
    }

    let numberOfIcons = 50;

    while (numberOfIcons--) {
      let largeIcon = new IconDefinition(this._atlasLoader);

      largeIcon.addLayer({
        asset: 'indicator-icon-background',
        color: 0xffffff * Math.random(),
        alpha: NumberUtils.flipCoin() ? Math.random() : 1,
      });
      largeIcon.addLayer({
        asset: 'ip-icon',
        color: 0xffffff * Math.random(),
      });

      this.iconArray.push(IconGenerator.make(largeIcon));

      let iconSmall = new IconDefinition(this._atlasLoader, { resolution: '@2.5x' });

      iconSmall.addLayer({
        asset: 'indicator-icon-background',
        color: 0xffffff * Math.random(),
        alpha: NumberUtils.flipCoin() ? Math.random() : 1,
      });
      iconSmall.addLayer({
        asset: 'ip-icon',
        color: 0xffffff * Math.random(),
      });

      this.iconArray.push(IconGenerator.make(iconSmall));
    }

    let { canvas } = this.threeView;

    if (canvas.parentElement) {
      this.setParentStyle(canvas.parentElement);
    }

    this.iconArray.forEach((iconMesh) => {
      let { bitmapComposer } = iconMesh;

      if (bitmapComposer?.spriteRegion?.bitmap) {
        this.addCanvasStyle(bitmapComposer.spriteRegion.bitmap.canvas);

        let container = canvas.parentElement;

        if (container) {
          container.insertBefore(bitmapComposer.spriteRegion.bitmap.canvas, container.firstChild);
        }
      }
    });

    this.textArray.forEach((labelMesh) => {
      let { textGenerator } = labelMesh;

      if (textGenerator?.spriteRegion?.bitmap) {
        this.addCanvasStyle(textGenerator.spriteRegion.bitmap.canvas);

        let container = canvas.parentElement;

        if (container) {
          container.insertBefore(textGenerator.spriteRegion.bitmap.canvas, container.firstChild);
        }
      }
    });
  }

  setParentStyle(parentElement: HTMLElement) {
    parentElement.style.overflow = 'visible';
    parentElement.style.height = 'auto';
    parentElement.style.backgroundColor = '#35353e';
  }

  addCanvasStyle(canvas: HTMLElement) {
    canvas.style.border = '1px solid black';
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
  }

  dispose() {
    BitmapComposer.dispose();
    LabelGenerator.dispose();
    super.dispose();
  }
}
