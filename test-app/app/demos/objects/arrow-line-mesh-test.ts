import {
  ArrowLineMesh,
  ArrowLineMeshSettings,
  VERTEX_LAYOUT_MODE,
} from '@crowdstrike/graphics-core';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';
import * as THREE from 'three';

import type { IArrowLineMeshType } from '@crowdstrike/graphics-core';
import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class ArrowLineMeshTest extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  _dtAcc: number;
  _arrowMaterial: THREE.MeshBasicMaterial;
  _lineMaterial: THREE.LineBasicMaterial;
  simpleArrowLine: IArrowLineMeshType;
  distributeArrowLine: IArrowLineMeshType;

  spline: IArrowLineMeshType;
  splineB: IArrowLineMeshType;
  normalArrowLine: IArrowLineMeshType;
  angle: number;
  zRoArrowLine: IArrowLineMeshType;
  yRoArrowLine: IArrowLineMeshType;

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);
    this.threeView.camera.position.z = 300;

    this._dtAcc = 0;
    this._arrowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this._lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
    });

    let simpleArrowLineMeshSettings = new ArrowLineMeshSettings();

    simpleArrowLineMeshSettings.arrowScale = 4;
    simpleArrowLineMeshSettings.endOffset = 4;
    simpleArrowLineMeshSettings.handleScale.set(4, 4, 4);
    simpleArrowLineMeshSettings.hasEndArrow = true;
    simpleArrowLineMeshSettings.hasHandle = true;
    simpleArrowLineMeshSettings.hasStartArrow = true;
    simpleArrowLineMeshSettings.startOffset = 4;

    this.simpleArrowLine = new ArrowLineMesh(
      this._lineMaterial,
      this._arrowMaterial,
      simpleArrowLineMeshSettings,
    );
    this.simpleArrowLine.start.set(50, 0, 0);
    this.simpleArrowLine.end.set(-50, 0, 0);
    this.simpleArrowLine.setVertexColors(0xff0000);
    this.simpleArrowLine.update();
    this.threeView.add(this.simpleArrowLine);

    let distributeArrowLineMeshSettings = new ArrowLineMeshSettings();

    distributeArrowLineMeshSettings.arrowScale = 4;
    distributeArrowLineMeshSettings.divisions = 20;
    distributeArrowLineMeshSettings.drawMode = VERTEX_LAYOUT_MODE.DISTRIBUTE;
    distributeArrowLineMeshSettings.endOffset = 4;
    distributeArrowLineMeshSettings.handleScale.set(3, 3, 3);
    distributeArrowLineMeshSettings.hasEndArrow = false;
    distributeArrowLineMeshSettings.hasHandle = true;
    distributeArrowLineMeshSettings.hasStartArrow = true;
    distributeArrowLineMeshSettings.isWobbleEnabled = true;
    distributeArrowLineMeshSettings.maxVertices = 22;
    distributeArrowLineMeshSettings.startOffset = 4;
    distributeArrowLineMeshSettings.wobbleX = 2;
    distributeArrowLineMeshSettings.wobbleY = 2;

    this.distributeArrowLine = new ArrowLineMesh(
      this._lineMaterial,
      this._arrowMaterial,
      distributeArrowLineMeshSettings,
    );
    this.distributeArrowLine.start.set(50, 20, 0);
    this.distributeArrowLine.end.set(-50, 20, 0);
    this.distributeArrowLine.setVertexColors(0x0000ff);
    this.distributeArrowLine.update();
    this.threeView.add(this.distributeArrowLine);

    let splineMeshSettings = new ArrowLineMeshSettings();

    splineMeshSettings.divisions = 50;
    splineMeshSettings.drawMode = VERTEX_LAYOUT_MODE.CURVE_C;
    splineMeshSettings.hasEndArrow = true;
    splineMeshSettings.hasStartArrow = true;
    splineMeshSettings.endOffset = 5;
    splineMeshSettings.startOffset = 5;
    splineMeshSettings.arrowScale = 3;

    this.spline = new ArrowLineMesh(this._lineMaterial, this._arrowMaterial, splineMeshSettings);
    this.spline.start.set(0, 70, 0);
    this.spline.end.set(0, 110, 0);
    this.spline.update();
    this.threeView.add(this.spline);

    let splineBMeshSettings = new ArrowLineMeshSettings();

    splineBMeshSettings.divisions = 50;
    splineBMeshSettings.maxVertices = 52;
    splineBMeshSettings.drawMode = VERTEX_LAYOUT_MODE.CURVE_S;
    splineBMeshSettings.hasEndArrow = true;
    splineBMeshSettings.hasStartArrow = true;
    splineBMeshSettings.endOffset = 0.01;
    splineBMeshSettings.startOffset = 0.01;
    splineBMeshSettings.arrowScale = 3;

    this.splineB = new ArrowLineMesh(this._lineMaterial, this._arrowMaterial, splineBMeshSettings);
    this.splineB.start.set(0, -70, 0);
    this.splineB.end.set(0, -110, 0);
    this.splineB.update();
    this.threeView.add(this.splineB);

    let normalArrowLineMeshSettings = new ArrowLineMeshSettings();

    normalArrowLineMeshSettings.arrowScale = 4;
    normalArrowLineMeshSettings.divisions = 4;
    normalArrowLineMeshSettings.drawMode = VERTEX_LAYOUT_MODE.NORMALIZE;
    normalArrowLineMeshSettings.endOffset = 4;
    normalArrowLineMeshSettings.handleScale.set(3, 3, 3);
    normalArrowLineMeshSettings.hasEndArrow = true;
    normalArrowLineMeshSettings.hasHandle = true;
    normalArrowLineMeshSettings.hasStartArrow = false;
    normalArrowLineMeshSettings.isWobbleEnabled = true;
    normalArrowLineMeshSettings.maxVertices = 6;
    normalArrowLineMeshSettings.startOffset = 4;
    normalArrowLineMeshSettings.wobbleX = 2;
    normalArrowLineMeshSettings.wobbleY = 2;

    let normals = [0, 0.1, 0.2, 0.3, 0.4, 1];

    this.normalArrowLine = new ArrowLineMesh(
      this._lineMaterial,
      this._arrowMaterial,
      normalArrowLineMeshSettings,
    );
    this.normalArrowLine.start.set(50, -20, 0);
    this.normalArrowLine.end.set(-50, -20, 0);
    this.normalArrowLine.setVertexColors(0x00ff00);
    this.normalArrowLine.setNormalisedVertexPositionArray(normals);
    this.normalArrowLine.update();
    this.threeView.add(this.normalArrowLine);

    let zRoArrowLineMeshSettings = new ArrowLineMeshSettings();

    zRoArrowLineMeshSettings.arrowScale = 2;
    zRoArrowLineMeshSettings.endOffset = 0;
    zRoArrowLineMeshSettings.handleScale.set(2, 2, 2);
    zRoArrowLineMeshSettings.hasEndArrow = true;
    zRoArrowLineMeshSettings.hasHandle = true;
    zRoArrowLineMeshSettings.hasStartArrow = true;
    zRoArrowLineMeshSettings.startOffset = 0;

    this.angle = 0;
    this.zRoArrowLine = new ArrowLineMesh(
      this._lineMaterial,
      this._arrowMaterial,
      zRoArrowLineMeshSettings,
    );
    this.zRoArrowLine.start.set(100, 0, 0);
    this.zRoArrowLine.end.set(100, 50, 0);
    this.zRoArrowLine.setVertexColors(0xffffff);
    this.zRoArrowLine.update();
    this.zRoArrowLine.setLabel('Hello dave', 0xffffff);
    this.threeView.add(this.zRoArrowLine);

    this.yRoArrowLine = new ArrowLineMesh(
      this._lineMaterial,
      this._arrowMaterial,
      zRoArrowLineMeshSettings,
    );
    this.yRoArrowLine.start.set(-100, 0, 0);
    this.yRoArrowLine.end.set(-100, 50, 0);
    this.yRoArrowLine.setVertexColors(0xffffff);
    this.yRoArrowLine.update();
    this.threeView.add(this.yRoArrowLine);
  }

  dispose() {
    this.threeView.remove(this.simpleArrowLine);
    this.simpleArrowLine.dispose();
    this.simpleArrowLine = null as never;

    this.threeView.remove(this.distributeArrowLine);
    this.distributeArrowLine.dispose();
    this.distributeArrowLine = null as never;

    this.threeView.remove(this.spline);
    this.spline.dispose();
    this.spline = null as never;

    this.threeView.remove(this.normalArrowLine);
    this.normalArrowLine.dispose();
    this.normalArrowLine = null as never;

    this.threeView.remove(this.zRoArrowLine);
    this.zRoArrowLine.dispose();
    this.zRoArrowLine = null as never;

    this.threeView.remove(this.yRoArrowLine);
    this.yRoArrowLine.dispose();
    this.yRoArrowLine = null as never;

    super.dispose();
  }

  render(dt: number) {
    super.render();

    this.angle += 1;

    let x = 50 * Math.cos((this.angle * Math.PI) / 180);
    let y = 50 * Math.sin((this.angle * Math.PI) / 180);

    if (this._dtAcc > 150) {
      this.distributeArrowLine.update();
      this.normalArrowLine.update();
      this._dtAcc = 0;
    }

    if (Math.random() < .005) {
      this.zRoArrowLine.setLabel(`angle: ${x.toFixed(1)}`, 0xffffff);
    }

    this.zRoArrowLine.start.set(100, 0, 0);
    this.zRoArrowLine.end.set(100 + x, y, 0);
    this.zRoArrowLine.update();

    this.yRoArrowLine.start.set(-100, 0, 0);
    this.yRoArrowLine.end.set(-100 + x, 0, y);
    this.yRoArrowLine.update();

    this.spline.start.set(0, 100, 0);
    this.spline.end.set(x, 100 + y, 100 + y);
    this.spline.update();

    this.splineB.start.set(0, -100, 0);
    this.splineB.end.set(-x, -100 - y, 0);
    this.splineB.update();

    this._dtAcc += dt;
  }
}
