import { LineMesh2, LineMeshSettings, VERTEX_LAYOUT_MODE } from '@crowdstrike/graphics-core';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';
import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

import type { ILineMesh2Type } from '@crowdstrike/graphics-core';
import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class LineMesh2Test extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  _dtAcc: number;
  _material: LineMaterial;
  _vertexMaterial: LineMaterial;
  _lineMaterial: LineMaterial;
  line: ILineMesh2Type;
  fatLine: ILineMesh2Type;
  fatSpline: ILineMesh2Type;
  distributedLine: ILineMesh2Type;
  normalizedLine: ILineMesh2Type;
  increment: number;

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);
    this.threeView.camera.position.z = 300;

    this._dtAcc = 0;

    this._material = new LineMaterial({
      color: 0xffffff,
      linewidth: 5,
      dashed: false,
    });

    this._vertexMaterial = new LineMaterial({
      color: 0xffffff,
      linewidth: 5,
      dashed: false,
      vertexColors: true,
    });

    this.line = new LineMesh2(this._material, new LineMeshSettings());
    this.line.start.set(0, -100, 0);
    this.line.end.set(0, -50, 0);
    this.line.update();
    this.threeView.add(this.line);

    this._lineMaterial = new LineMaterial({
      color: 0xffffff,
      linewidth: 5,
      vertexColors: true,
      dashed: false,
    });

    let lineSettings = new LineMeshSettings();

    lineSettings.vertexColor = new THREE.Color(0xff0000);
    this.fatLine = new LineMesh2(this._lineMaterial, lineSettings);
    this.fatLine.start.set(0, -50, 0);
    this.fatLine.end.set(0, 0, 0);
    this.fatLine.update();
    this.threeView.add(this.fatLine);

    let splineSettings = new LineMeshSettings({
      drawMode: VERTEX_LAYOUT_MODE.CURVE_C,
      divisions: 50,
      maxVertices: 52,
      vertexColor: new THREE.Color(0x00ff00),
    });

    this.fatSpline = new LineMesh2(this._lineMaterial, splineSettings);
    this.fatSpline.start.set(0, 50, 0);
    this.fatSpline.end.set(0, 0, 0);
    this.fatSpline.update();
    this.threeView.add(this.fatSpline);

    let distributeLineMesh = new LineMeshSettings({
      drawMode: VERTEX_LAYOUT_MODE.DISTRIBUTE,
      divisions: 50,
      maxVertices: 52,
      vertexColor: new THREE.Color(0x0000ff),
      isWobbleEnabled: true,
      wobbleX: 0,
      wobbleY: 5,
    });

    this.distributedLine = new LineMesh2(this._lineMaterial, distributeLineMesh);
    this.distributedLine.start.set(-200, 0, 0);
    this.distributedLine.end.set(0, 0, 0);
    this.distributedLine.update();
    this.threeView.add(this.distributedLine);

    let normalizedLineMesh = new LineMeshSettings({
      drawMode: VERTEX_LAYOUT_MODE.NORMALIZE,
      divisions: 10,
      maxVertices: 12,
      vertexColor: new THREE.Color(0x00ffff),
      isWobbleEnabled: true,
      wobbleX: 0,
      wobbleY: 5,
    });

    this.normalizedLine = new LineMesh2(this._vertexMaterial, normalizedLineMesh);
    this.normalizedLine.start.set(200, 0, 0);
    this.normalizedLine.end.set(0, 0, 0);
    this.normalizedLine.update();
    this.normalizedLine.setNormalisedVertexPositionArray([
      0, 0.01, 0.02, 0.03, 0.31, 0.32, 0.6, 0.9, 0.91, 0.92, 1,
    ]);
    this.threeView.add(this.normalizedLine);

    let aHelper = new THREE.AxesHelper(90);

    this.threeView.add(aHelper);
    this.increment = 0;
  }

  dispose() {
    super.dispose();
  }

  render(dt: number) {
    super.render();

    this._dtAcc += dt;
    this.increment += 0.0025;
    this.fatLine.end.set(
      50 * Math.cos(2 * Math.PI * this.increment),
      50 * Math.sin(2 * Math.PI * this.increment) - 50,
      0,
    );

    this.fatSpline.end.set(
      50 * Math.cos(2 * Math.PI * this.increment),
      50 * Math.sin(2 * Math.PI * this.increment) + 50,
      0,
    );

    this.line.end.set(
      50 * Math.cos(2 * Math.PI * this.increment),
      50 * Math.sin(2 * Math.PI * this.increment) - 100,
      0,
    );

    if (this._dtAcc > 250) {
      this.distributedLine.update();
      this.normalizedLine.update();
      this._dtAcc = 0;
      this.normalizedLine.setVertexColors(Math.random() * 0xffffff);
    }

    this.fatSpline.update();
    this.fatLine.update();
    this.line.update();
  }
}
