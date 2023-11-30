import { BarMesh } from '@crowdstrike/graphics-core';
import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';
import * as THREE from 'three';

import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class BarMeshTest extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  counter: number;
  dtAcc: number;
  barMesh: BarMesh
  barMeshH: BarMesh
  barMeshD: BarMesh

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);
    this.threeView.camera.position.z = 300;
    this.counter = 0;
    this.dtAcc = 0;
    this.barMesh = new BarMesh(new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    this.threeView.add(this.barMesh);
    this.barMeshH = new BarMesh(new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    this.threeView.add(this.barMeshH);
    this.barMeshD = new BarMesh(new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    this.threeView.add(this.barMeshD);

    this.threeView.add(new THREE.AxesHelper(90));
  }

  dispose() {
    super.dispose();
  }

  render(dt: number) {
    super.render();

    if (this.dtAcc > 60) {
      this.counter += 0.02;
      this.barMesh.width = Math.floor(Math.sin(this.counter) * 100);
      this.barMeshH.height = Math.floor(Math.cos(this.counter) * 100);
      this.barMeshD.depth = Math.floor(Math.tan(this.counter) * 100);
      this.dtAcc = 0;
    }

    this.dtAcc += dt;
  }
}
