import { ZigZagLineMesh , ZigZagLineMeshSettings } from '@crowdstrike/graphics-core';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';
import * as THREE from 'three';

import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class ZigZagLineMeshTest extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  _dtAcc: number;
  _lineMaterial: THREE.LineBasicMaterial;
  zigZagLine: ZigZagLineMesh;
  anglePosition: number;
  angleDistance: number;
  angleVertices: number;

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);
    this.threeView.camera.position.z = 300;

    this._dtAcc = 0;
    this._lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

    let lineSettings = new ZigZagLineMeshSettings();

    lineSettings.xDistance = 8;

    this.zigZagLine = new ZigZagLineMesh(this._lineMaterial, lineSettings);
    this.zigZagLine.start.set(0, 100, 0);
    this.zigZagLine.end.set(0, -100, 0);
    this.zigZagLine.update();
    this.threeView.add(this.zigZagLine);

    let aHelper = new THREE.AxesHelper(90);

    aHelper.position.y = -10;
    this.threeView.add(aHelper);

    this.anglePosition = 0;
    this.angleDistance = 0;
    this.angleVertices = 0;
  }

  dispose() {
    this.threeView.remove(this.zigZagLine);
    this.zigZagLine.dispose();
    this.zigZagLine = null as never;

    super.dispose();
  }

  render(dt: number) {
    super.render();

    this.anglePosition += 0.04;
    this.angleDistance += 0.01;
    (this.zigZagLine.settings as ZigZagLineMeshSettings).xDistance = Math.sin(this.angleDistance) * 8;
    this.zigZagLine.end.y = -Math.abs(Math.sin(this.anglePosition) * 100);

    if (this._dtAcc > 250) {
      this.angleVertices += 0.04;
      this.zigZagLine.updateMaxVertices(
        4 + Math.abs(Math.round(Math.sin(this.angleVertices) * 50)),
      );
      this._dtAcc = 0;
    }

    this.zigZagLine.update();
    this._dtAcc += dt;
  }
}
