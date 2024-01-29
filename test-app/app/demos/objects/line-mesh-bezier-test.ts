import { LineMesh, LineMeshSettings, VERTEX_LAYOUT_MODE } from '@crowdstrike/graphics-core';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';
import * as THREE from 'three';

import type { ILineMesh } from '@crowdstrike/graphics-core';
import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class LineMeshBezierTest extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  _material: THREE.LineBasicMaterial;
  lines: ILineMesh[];

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);
    this.threeView.camera.position.z = 300;

    this._material = new THREE.LineBasicMaterial({ color: 0xffffff });

    let lineSettings = new LineMeshSettings();

    lineSettings.drawMode = VERTEX_LAYOUT_MODE.CURVE_S;
    lineSettings.divisions = 50;
    lineSettings.maxVertices = 52;
    lineSettings.controlPointOffset = 100;
    lineSettings.showDebugControlPoints = true;

    this.lines = [];

    let line;

    line = new LineMesh(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(100, 100, 100);
    line.update();
    this.threeView.add(line);

    line = new LineMesh(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(100, 50, 50);
    line.update();
    this.threeView.add(line);

    line = new LineMesh(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(100, 0, 0);
    line.update();
    this.threeView.add(line);

    line = new LineMesh(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(100, -50, -50);
    line.update();
    this.threeView.add(line);

    line = new LineMesh(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(100, -100, 0);
    line.update();
    this.threeView.add(line);

    line = new LineMesh(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(-100, 100, -100);
    line.update();
    this.threeView.add(line);

    line = new LineMesh(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(-100, 50, -50);
    line.update();
    this.threeView.add(line);

    line = new LineMesh(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(-100, 0, 0);
    line.update();
    this.threeView.add(line);

    line = new LineMesh(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(-100, -50, 50);
    line.update();
    this.threeView.add(line);

    line = new LineMesh(this._material, lineSettings);
    line.start.set(0, 0, 0);
    line.end.set(-100, -100, 100);
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
