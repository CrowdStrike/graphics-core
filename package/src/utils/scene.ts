import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module.js";

import { ThreeJSView, ThreeJSViewParams } from "../core/ThreeJSView";

import type * as THREE from "three";

// This will become mutated once a THREE.WebGLRenderer
// is instantiated
export let GL_MAX_TEXTURE_IMAGE_UNITS = 1;
export let GL_MAX_TEXTURE_SIZE = 1024;

export interface ThreeSceneEntities {
  scene: THREE.Scene;
  stats: Stats;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  container: THREE.Object3D<THREE.Event>;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
}

export const setupScene = (element: HTMLElement) => {
  const params = new ThreeJSViewParams();

  params.isOrthographic = false;
  params.shouldUseTrackBall = false;
  params.pixelDensity = window.devicePixelRatio;
  params.isFullScreen = true;
  params.clearColor = 0x000000;

  const threeJsView = new ThreeJSView(params);

  threeJsView.enableTrackBall = false;

  const { scene, renderer, camera, container } = threeJsView;

  camera.position.z = 400;

  const stats = new Stats();

  GL_MAX_TEXTURE_IMAGE_UNITS = renderer.capabilities.maxTextures;
  GL_MAX_TEXTURE_SIZE = renderer.capabilities.maxTextureSize;

  element.appendChild(renderer.domElement);
  stats.dom.style.top = "";
  element.appendChild(stats.dom);

  threeJsView.setSize(window.innerWidth, window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableRotate = false;

  renderer.domElement.focus();

  window.addEventListener("resize", () => {
    threeJsView.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, stats, camera, container, renderer, controls, threeJsView };
};

export const setupOffscreenCanvas = () => {
  const width = 1024 * window.devicePixelRatio;
  const height = 1024 * window.devicePixelRatio;

  const offscreenCanvas = document.createElement("canvas");

  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  offscreenCanvas.style.width = `${width / window.devicePixelRatio}px`;
  offscreenCanvas.style.height = `${height / window.devicePixelRatio}px`;

  const ctx = offscreenCanvas.getContext("2d");

  if (!ctx) return;

  const bValue = Math.random() * 255;

  for (let i = 0; i < height; i += 50) {
    for (let j = 0; j < width; j += 50) {
      ctx.fillStyle = `rgb(${(i / height) * 255}, ${
        (j / width) * 255
      }, ${bValue})`;
      ctx.fillRect(i, j, 50, 50);
    }
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "24px monospace";
  ctx.fillStyle = "black";

  for (let i = 0; i < height; i += width / 10) {
    for (let j = 0; j < width; j += height / 10) {
      ctx.fillText(
        `${(j / width).toFixed(1)}, ${(i / height).toFixed(1)}`,
        i,
        j,
      );
    }
  }

  return offscreenCanvas;
};
