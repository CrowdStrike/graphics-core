import { LineMesh2, LineMeshSettings, VERTEX_LAYOUT_MODE } from '@crowdstrike/graphics-core';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';
import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

import type { ILineMesh2 } from '@crowdstrike/graphics-core';
import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class LineMesh2BezierTest extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  _material: LineMaterial;
  lines: ILineMesh2[];

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);
    this.threeView.camera.position.z = 300;

    this._material = new LineMaterial({
      color: 0xffffff,
      linewidth: 5,
      dashed: false,
    });

    let lineSettings = new LineMeshSettings();

    lineSettings.drawMode = VERTEX_LAYOUT_MODE.CURVE_S;
    lineSettings.divisions = 50;
    lineSettings.maxVertices = 52;
    lineSettings.controlPointOffset = 100;
    lineSettings.showDebugControlPoints = true;

    this.lines = [];

    let line;

    line = new LineMesh2(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(100, 100, 100);
    line.update();
    this.threeView.add(line);

    line = new LineMesh2(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(100, 50, 50);
    line.update();
    this.threeView.add(line);

    line = new LineMesh2(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(100, 0, 0);
    line.update();
    this.threeView.add(line);

    line = new LineMesh2(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(100, -50, -50);
    line.update();
    this.threeView.add(line);

    line = new LineMesh2(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(100, -100, 0);
    line.update();
    this.threeView.add(line);

    line = new LineMesh2(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(-100, 100, -100);
    line.update();
    this.threeView.add(line);

    line = new LineMesh2(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(-100, 50, -50);
    line.update();
    this.threeView.add(line);

    line = new LineMesh2(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(-100, 0, 0);
    line.update();
    this.threeView.add(line);

    line = new LineMesh2(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(-100, -50, 50);
    line.update();
    this.threeView.add(line);

    lineSettings = new LineMeshSettings();
    lineSettings.drawMode = VERTEX_LAYOUT_MODE.CURVE_S;
    lineSettings.divisions = 50;
    lineSettings.maxVertices = 52;
    lineSettings.controlPointOffset = 500;
    lineSettings.showDebugControlPoints = true;

    line = new LineMesh2(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(-100, -1000, 0);
    line.update();
    this.threeView.add(line);

    let aHelper = new THREE.AxesHelper(90);

    this.threeView.add(aHelper);
  }

  dispose() {
    super.dispose();
  }

  render() {
    super.render();
  }
}
