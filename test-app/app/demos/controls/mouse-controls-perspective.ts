import { MouseControls , MousePickerEvents , MouseUtils } from '@crowdstrike/graphics-core';
import {ThreeJsComponentInterface} from 'test-app-for-graphics-core/utils/threejs-component-interface'
import * as THREE from 'three';

import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class MouseControlsPerspective extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  mouseControls: MouseControls

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);

    this.threeView.shouldUseTrackBall = false;
    this.threeView.camera.position.z = 110;
    this.threeView.trackballControls && this.threeView.trackballControls.dispose();
    this.threeView.trackballControls = null as never;

    this.mouseControls = new MouseControls({
      isTopDown: false,
      object3DContainer: this.threeView.container,
      threeView: this.threeView,
      shouldDoubleRender: true,
      maxScale: 2.5,
      minScale: 0.25
    });

    this.mouseControls.throwDampingFactor = 0.1;
    this.mouseControls.throwThreshold = 2;

    this.threeView.mousePicker.addEventListener(MousePickerEvents.ROLL_OUT, this._onRollOut, this);
    this.threeView.mousePicker.addEventListener(
      MousePickerEvents.ROLL_OVER,
      this._onRollOver,
      this,
    );

    if (this.threeView.camera.type === 'PerspectiveCamera') {
      this.threeView.camera.position.set(1000, 1000, 1000);
      this.threeView.camera.lookAt(this.threeView.scene.position);
    } else {
      this.threeView.camera.position.set(20000, 20000, 20000);
      this.threeView.camera.lookAt(this.threeView.scene.position);
    }

    this._draw();
  }

  _onRollOut() {
    MouseUtils.rollout();
  }

  _onRollOver() {
    MouseUtils.rollover();
  }

  _draw() {
    let cubeSpacing = 35;
    let gridSize = 20;
    let size = 15;
    let xDistance = gridSize * cubeSpacing;
    let geometry = new THREE.BoxGeometry(size, size, size, 1, 1, 1);
    let material = new THREE.MeshNormalMaterial();

    for (let x = 0; x <= gridSize; x++) {
      for (let y = 0; y <= gridSize; y++) {
        let mesh = new THREE.Mesh(geometry, material);

        mesh.position.x = x * cubeSpacing - xDistance / 2;
        mesh.position.z = y * cubeSpacing - xDistance / 2;
        this.threeView.add(mesh);
      }
    }
  }

  dispose() {
    this.mouseControls.dispose();
    super.dispose();
  }

  render() {
    super.render();
    this.mouseControls.render();
  }
}
