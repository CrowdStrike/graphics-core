import { FontLoader, LabelGenerator, NumberUtils, TextStyle } from '@crowdstrike/graphics-core';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';

import type { LabelMesh} from '@crowdstrike/graphics-core';
import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class LabelGeneratorTest extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  fontLoader: FontLoader;
  _dtAcc: number;
  label: LabelMesh | null;

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);
    this.threeView.camera.position.z = 300;
    this.fontLoader = new FontLoader();
    this.fontLoader
      .load('sans-serif')
      .then(() => this._fontLoaded())
      .catch(() => this._fontLoadError());

    this._dtAcc = 0;
    this.label = null;
  }

  _fontLoaded() {
    let style = new TextStyle();

    style.name = 'style-name';
    style.fontSize = 60;
    style.fontColor = 0xff0000;
    style.fontName = 'sans-serif';

    let labelScale = 0.25;

    this.label = LabelGenerator.make('Hello World', style);
    this.label.material.transparent = true;
    this.label.scale.set(labelScale, labelScale, labelScale);
    this.threeView.add(this.label);

    let counter = 40;
    let range = 100;

    while (counter--) {
      let labelStyle = new TextStyle();

      labelStyle.name = `${counter}-style-name`;
      labelStyle.fontSize = 60 * Math.random();
      labelStyle.fontColor = 0xffffff * Math.random();
      labelStyle.fontName = 'sans-serif';

      let x = NumberUtils.getRandomInt(-range, range);
      let y = NumberUtils.getRandomInt(-range, range);
      let z = NumberUtils.getRandomInt(-range, range);

      let label = LabelGenerator.make(this.shuffle('Hello World'), labelStyle);

      label.position.set(x, y, z);
      label.scale.set(labelScale, labelScale, labelScale);
      this.threeView.add(label);
    }
  }

  _fontLoadError() {
    // eslint-disable-next-line no-console
    console.warn('TestLabelGenerator: Font loading error');
    this._fontLoaded();
  }

  dispose() {
    if (this.label) {
      this.threeView.remove(this.label);
      this.label.dispose();
      this.label = null;
    }

    LabelGenerator.dispose();
    super.dispose();
  }

  render(dt: number) {
    super.render();

    if (this.label) {
      this._dtAcc += dt;

      if (this._dtAcc > 500) {
        let style = new TextStyle();

        style.name = 'style-name';
        style.fontSize = 60;
        style.fontColor = 0xffffff * Math.random();
        style.fontName = 'sans-serif';
        LabelGenerator.update(this.label, this.shuffle('Hello World'), style);
        this._dtAcc = 0;
      }
    }
  }

  shuffle(str: string) {
    let a = str.split('');
    let n = a.length;

    for (let i = n - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let tmp = a[i];

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      a[i] = a[j]

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      a[j] = tmp;
    }

    return a.join('');
  }
}
