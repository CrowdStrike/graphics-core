import { ThreeJsComponentInterface } from 'test-app-for-graphics-core/utils/threejs-component-interface';
import * as THREE from 'three';

import type { EmberComponentInterfaceParams } from 'test-app-for-graphics-core/utils/ember-component-interface';

export class EmberComponentInterfaceTest extends ThreeJsComponentInterface {
  updateTheme = (_theme: string) => {
    _theme;
  };

  mesh: THREE.Mesh

  constructor(settings: EmberComponentInterfaceParams) {
    super(settings);

    let geometry = new THREE.TorusKnotGeometry(50, 10, 50, 80);
    let material = new THREE.MeshNormalMaterial();

    this.mesh = new THREE.Mesh(geometry, material);
    this.threeView.add(this.mesh);
    this.threeView.camera.position.z = 100;
  }

  render() {
    super.render();
    this.mesh.rotation.x += 0.01;
    this.mesh.rotation.y += 0.005;
  }
}
