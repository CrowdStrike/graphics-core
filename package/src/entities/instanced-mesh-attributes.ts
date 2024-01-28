/**
 * This class enables instanced rendering of any kind of mesh
 * with per-mesh setting of scale, position, and rotation.
 */
import * as THREE from 'three';

import { InstancedAttributes } from './instanced-attributes';

import type { ThreeJSView } from '../core/ThreeJSView';

export class InstancedMeshAttributes<
  G extends THREE.BufferGeometry,
  M extends THREE.Material,
> extends InstancedAttributes {
  readonly color = new THREE.Color();
  readonly vector = new THREE.Vector3();
  readonly translation3 = new THREE.Vector3();
  readonly s = new THREE.Vector3();
  readonly matrix = new THREE.Matrix4();
  readonly bbox = new THREE.Box3();
  readonly q = new THREE.Quaternion(0, 0, 0, 0);

  constructor({ geometry, material }: { geometry: G; material: M }) {
    const instanceCount = 10000;

    const attributes = {
      // 1-step
      instanceOpacity: new THREE.InstancedBufferAttribute(new Float32Array(instanceCount).fill(1), 1),
      // 4-step
      color: new THREE.InstancedBufferAttribute(new Float32Array(instanceCount * 4).fill(1), 4),
    };

    geometry.setAttribute('instanceOpacity', attributes.instanceOpacity);
    geometry.setAttribute('color', attributes.color);

    // Taken from here: https://github.com/mrdoob/three.js/issues/22102
    const visibilityChunk = [
      `#include <project_vertex>`,
      // move outside of clip space
      `gl_Position = mix( vec4( 0, 0, - 1, 1 ), gl_Position, instanceDisplay );`,
    ].join('\n');

    const attributeChunk = ['#include <common>', 'attribute float instanceDisplay;'].join('\n');

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <project_vertex>', visibilityChunk)
        .replace('#include <common>', attributeChunk);
    };

    super({
      geometry,
      material,
      attributes,
      count: instanceCount,
    });

    this.pollAttributeTasks();
  }

  setColor(idx: number, color: number | THREE.Color) {
    const [r, g, b, a] = color instanceof THREE.Color ? color.toArray() : this.color.setHex(color).toArray();

    this.addAttributeTask(() => {
      this.mesh.geometry.attributes.color.setXYZW(idx, r, g, b, a);
    });
  }

  setPosition(idx: number, x: number, y: number, z: number) {
    this.vector.set(x, y, z);
    this.mesh.getMatrixAt(idx, this.matrix);
    this.matrix.decompose(this.translation3, this.q, this.s);

    this.matrix.compose(this.vector, this.q, this.s);
    this.mesh.setMatrixAt(idx, this.matrix);
  }

  setRotation(idx: number, quaternion: THREE.Quaternion) {
    this.mesh.getMatrixAt(idx, this.matrix);
    this.matrix.decompose(this.translation3, this.q, this.s);
    this.matrix.compose(this.translation3, quaternion, this.s);
    this.mesh.setMatrixAt(idx, this.matrix);
  }

  setScale(idx: number, x: number, y: number, z: number) {
    this.mesh.getMatrixAt(idx, this.matrix);
    this.matrix.decompose(this.translation3, this.q, this.s);

    this.s.set(x, y, z);
    this.matrix.compose(this.translation3, this.q, this.s);
    this.mesh.setMatrixAt(idx, this.matrix);
  }

  addMeshToScene(scene: THREE.Object3D<THREE.Event> | THREE.Scene | ThreeJSView): void {
    super.addMeshToScene(scene);
  }

  executeAttributeTasks() {
    if (!this.mesh) return;
    super.executeAttributeTasks();

    this.mesh.geometry.attributes.instanceOpacity.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;

    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
