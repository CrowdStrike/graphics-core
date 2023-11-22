import * as THREE from 'three';

/**
 * A pool of spheres that can be used for debugging.
 */
export class DebugSpheres {
  radius: number;
  scene: THREE.Scene;
  spheres: THREE.Mesh[] = [];
  spheresIndex = 0;

  /**
   * @param scene : THREE.Scene
   * @param radius : Number
   * @param numSpheres : Number
   * @param color : Number (hex)
   */
  constructor(scene: THREE.Scene, radius = 20, numSpheres = 40, color = 0xff0000) {
    this.radius = radius;
    this.scene = scene;

    let sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    let sphereMaterial = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < numSpheres; i++) {
      let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

      this.scene.add(sphere);
      this.spheres.push(sphere);
    }
  }

  /**
   * @param position : THREE.Vector3()
   * @return {THREE.Mesh}
   */
  addSphere(position = new THREE.Vector3()) {
    let sphere = this.spheres[this.spheresIndex];

    if (!sphere) {
      throw new Error('DebugSpheres tried to access sphere out of bounds');
    }

    sphere.position.copy(position);
    sphere.scale.set(this.radius, this.radius, this.radius);
    this.spheresIndex = (this.spheresIndex + 1) % this.spheres.length;

    return sphere;
  }

  static createSphere(size = 2, color = 0xff0000) {
    let geometry = new THREE.SphereGeometry(size, 32, 32);
    let material = new THREE.MeshBasicMaterial({ color });

    return new THREE.Mesh(geometry, material);
  }
}
