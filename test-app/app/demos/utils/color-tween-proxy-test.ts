import {
  ColorTweenProxy,
  LineMesh2,
  LineMeshSettings,
  NumberUtils,
  VERTEX_LAYOUT_MODE,
} from '@crowdstrike/graphics-core';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';
import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

import type { ILineMesh2Type } from '@crowdstrike/graphics-core';
import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class ColorTweenProxyTest extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  colorProxy: ColorTweenProxy;
  _lineMaterial: LineMaterial;
  fatSpline: ILineMesh2Type;
  increment: number;

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);

    let color = 0xffffff * Math.random();

    this.colorProxy = new ColorTweenProxy({
      id: NumberUtils.generateUUID().slice(0, 10),
      color,
      onUpdate: (color) => this.onUpdateColor(color),
      onComplete: () => this.onCompleteColor(),
    });
    this.threeView.camera.position.z = 300;

    this._lineMaterial = new LineMaterial({
      color: 0xffffff,
      linewidth: 5,
      vertexColors: true,
      dashed: false,
    });

    let splineSettings = new LineMeshSettings({
      drawMode: VERTEX_LAYOUT_MODE.CURVE_C,
      divisions: 50,
      maxVertices: 52,
      vertexColor: new THREE.Color(color),
    });

    this.fatSpline = new LineMesh2(this._lineMaterial, splineSettings);
    this.fatSpline.start.set(0, 0, 0);
    this.fatSpline.end.set(0, 0, 0);
    this.fatSpline.update();
    this.threeView.add(this.fatSpline);

    let aHelper = new THREE.AxesHelper(90);

    this.threeView.add(aHelper);
    this.increment = 0;

    this.colorProxy.to({
      targetColor: Math.random() * 0xffffff,
      duration: 1,
    });
  }

  onCompleteColor() {
    this.colorProxy.to({
      targetColor: 0xffffff * Math.random(),
      duration: 1,
      delay: 0.5,
    });
  }

  onUpdateColor(color: number) {
    this.fatSpline.setVertexColors(color);
    this.fatSpline.update();
  }

  dispose() {
    super.dispose();
  }

  render() {
    super.render();

    this.increment += 0.0025;

    this.fatSpline.end.set(
      100 * Math.cos(2 * Math.PI * this.increment),
      100 * Math.sin(2 * Math.PI * this.increment),
      0,
    );

    this.fatSpline.update();
  }
}
