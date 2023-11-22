import { registerDestructor } from '@ember/destroyable';

import {
  GL_MAX_TEXTURE_IMAGE_UNITS,
  InstancedMultiUvMaterial,
  setupOffscreenCanvas,
  setupScene,
} from '@crowdstrike/graphics-core';
import Modifier from 'ember-modifier';
import * as THREE from 'three';

import type ApplicationInstance from '@ember/application/instance';

interface Args {
  named: never;
  positional: never;
}
export class MultiTextureShaderDemoModifier extends Modifier<Args> {
  raf?: number;
  renderer?: THREE.WebGLRenderer;
  offscreenCanvas?: HTMLCanvasElement;

  constructor(owner: ApplicationInstance, args: Args) {
    super(owner, args);

    registerDestructor(this, () => this.cleanup());
  }

  modify(element: HTMLElement) {
    const { scene, stats, camera, renderer, controls } = setupScene(element);

    controls.minDistance = 500;
    controls.maxDistance = 180000;

    const bbox = new THREE.Box3();
    const v3 = new THREE.Vector3();

    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const offscreenCanvas = setupOffscreenCanvas();

    this.offscreenCanvas = offscreenCanvas as HTMLCanvasElement;
    this.renderer = renderer;

    const canvasTexture = new THREE.CanvasTexture(
      offscreenCanvas as HTMLCanvasElement,
      THREE.UVMapping,
      THREE.RepeatWrapping,
      THREE.RepeatWrapping,
    );

    const videoElement: HTMLVideoElement | null = document.getElementById(
      'video',
    ) as HTMLVideoElement;

    if (videoElement) {
      videoElement.volume = 0;
    }

    const playButton: HTMLElement | null = document.getElementById('play-button');

    const pauseButton: HTMLElement | null = document.getElementById('pause-button');

    const playbackRateSlider: HTMLInputElement | null = document.getElementById(
      'video-playback-rate',
    ) as HTMLInputElement;

    playButton?.addEventListener('click', () => {
      if (videoElement) {
        videoElement.play();
      }
    });

    pauseButton?.addEventListener('click', () => {
      if (videoElement) {
        videoElement.pause();
      }
    });

    playbackRateSlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;

      if (playbackRateSlider) {
        if (target?.value) {
          videoElement.playbackRate = +target.value;
        }
      }
    });

    if (!videoElement) return;

    videoElement.style.display = 'none';

    const videoTexture = new THREE.VideoTexture(
      videoElement as HTMLVideoElement,
      THREE.UVMapping,
      THREE.RepeatWrapping,
      THREE.RepeatWrapping,
    );

    const perRow = 1000;
    const instanceCount = perRow * perRow;

    const videoAspectRatio = 1920 / 1080;

    const geometry = new THREE.PlaneGeometry(512, 512 / videoAspectRatio);

    const d = (geometry.parameters.width * perRow) / 2 / Math.tan(camera.fov / 2);

    camera.fov = 75;
    camera.near = 0.1;
    camera.position.z = -d / 2 - 40000;
    camera.far = -d / 2;
    camera.frustumCulled = false;
    camera.updateMatrix();
    camera.updateProjectionMatrix();

    geometry.attributes['uvOffset'] = new THREE.InstancedBufferAttribute(
      new Float32Array(
        Array(instanceCount)
          .fill(1)
          // .flatMap(() => [0, 0, 1, 1])
          .flatMap(() => {
            const r1 = Math.random() * 0.5;
            const r2 = Math.random() * 0.5;

            return [r1, r2, Math.random() > 0.3 ? r1 : 0.001, r1];
          }),
      ),
      4,
    );
    geometry.attributes['uvOffset'].needsUpdate = true;

    geometry.attributes['instanceColor'] = new THREE.InstancedBufferAttribute(
      new Float32Array(
        Array(instanceCount * 3)
          .fill(0)
          .flatMap(() => [0.5, 0.5, 0]),
      ),
      3,
    );
    geometry.attributes['instanceColor'].needsUpdate = true;

    geometry.attributes['instanceOpacity'] = new THREE.InstancedBufferAttribute(
      new Float32Array(
        Array(instanceCount)
          .fill(1)
          .map(() => 1),
      ),
      1,
    );
    geometry.attributes['instanceOpacity'].needsUpdate = true;

    geometry.attributes['instanceDisplay'] = new THREE.InstancedBufferAttribute(
      new Float32Array(Array(instanceCount).fill(1)),
      1,
    );
    geometry.attributes['instanceDisplay'].needsUpdate = true;

    let material: InstancedMultiUvMaterial;

    material = new InstancedMultiUvMaterial({
      map: videoTexture,
      alphaTest: 0.1,
      transparent: false,
      defines: {
        USE_SAMPLED_COLOR: true,
      },
    });

    if (GL_MAX_TEXTURE_IMAGE_UNITS) {
      material.texArray = Array(GL_MAX_TEXTURE_IMAGE_UNITS)
        .fill(null)
        .map(() => (Math.random() > -0.1 ? videoTexture : canvasTexture));
    } else {
      material.texArray = [videoTexture];
    }

    if (GL_MAX_TEXTURE_IMAGE_UNITS) {
      material.numTextures = GL_MAX_TEXTURE_IMAGE_UNITS;
    }

    geometry.attributes['texIdx'] = new THREE.InstancedBufferAttribute(
      new Float32Array(
        Array(instanceCount)
          .fill(1)
          .flatMap(() => Math.floor(Math.random() * material.numTextures)),
      ),
      1,
    );
    geometry.attributes['texIdx'].needsUpdate = true;

    const mesh = new THREE.InstancedMesh(geometry, material, perRow * perRow);

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const tmpVec = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    const xDisplacement = geometry.parameters.width * 1.01;
    const xOffset = (perRow * xDisplacement) / 2;
    const yDisplacement = geometry.parameters.height * 1.01;
    const yOffset = (perRow * xDisplacement) / 2;

    for (let i = 0; i < perRow * perRow; i++) {
      const row = Math.floor(i / perRow);
      const column = i % perRow;

      position.x = column * xDisplacement - xOffset;
      position.y = row * yDisplacement - yOffset;
      position.z = 100;

      v3.copy(position);
      bbox.expandByPoint(v3);

      quaternion.setFromAxisAngle(tmpVec.set(0, 1, 0), Math.PI / 4);

      quaternion.setFromEuler(rotation);

      scale.x = 1;
      scale.y = 1;
      scale.z = 1;

      matrix.compose(position, quaternion, scale);

      mesh.setMatrixAt(i, matrix);
    }

    scene.add(mesh);

    // center the mesh
    // mesh.position.x -= Math.abs(bbox.max.x - bbox.min.x) / 2;
    mesh.position.y += Math.abs(bbox.max.y - bbox.min.y) / 2;

    const animate = () => {
      this.raf = requestAnimationFrame(animate);
      controls.update();
      stats.update();

      // if (renderer.info.render.frame % 1 === 0) {
      //   for (let i = 0; i < mesh.count; i++) {
      // const [x, y, z, w] = [
      //   geometry.attributes.uvOffset.array[i * 4],
      //   geometry.attributes.uvOffset.array[i * 4 + 1],
      //   geometry.attributes.uvOffset.array[i * 4 + 2],
      //   geometry.attributes.uvOffset.array[i * 4 + 3],
      // ];
      // geometry.attributes.uvOffset.setXYZW(i, x, y, z, w);
      // dummy.applyMatrix4(matrix);
      // matrix.copyPosition(dummy.matrix);
      // dummy.rotation.y += 0.01;
      // dummy.updateMatrix();
      // mesh.setMatrixAt(i, dummy.matrix);
      //     // const scaleFactor = 0.8 + Math.random() * 0.4;
      //     // scale.set(scaleFactor, scaleFactor, 1);
      //     position.set(position.x, position.y + 1, position.z);
      // mesh.getMatrixAt(i, matrix);
      // matrix.decompose(position, quaternion, scale);
      // rotation.setFromQuaternion(quaternion);
      // rotation.x = Math.random();
      // quaternion.setFromEuler(rotation);
      // matrix.compose(position, quaternion, scale);
      // mesh.setMatrixAt(i, matrix);
      // }
      // geometry.attributes.uvOffset.needsUpdate = true;
      // }

      renderer.render(scene, camera);
    };

    animate();
  }

  cleanup() {
    this.raf && cancelAnimationFrame(this.raf);
    this.offscreenCanvas?.remove();
    this.renderer?.dispose();
  }
}
