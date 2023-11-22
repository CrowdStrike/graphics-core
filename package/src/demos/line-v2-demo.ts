import { Color } from "three";

import { NumberUtils } from "../graph-utils-v2/utils/number-utils";
import { LineV2Skeleton } from "../objects/lines-v2/line";
import { setupScene } from "../utils/scene";

import type { ThreeJSView } from "../core/ThreeJSView";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import type Stats from "three/examples/jsm/libs/stats.module.js";

const MAX_LINES = 12000;
const INCREMENT_MOD = 8;
const LINES_INCREMENT = 1000;
const INITIAL_LINES = 10;

export class LineV2Demo {
  threeJsView?: ThreeJSView;
  stats?: Stats;
  controls?: OrbitControls;
  isDisposed = false;
  lines: LineV2Skeleton[] = [];
  resizeDelegate = () => this.resize();
  framesCallback?: (
    fps: number,
    numberOfEntities: number,
    maxNumberOfEntities: number
  ) => void;
  finishedAddingCallback?: () => void;
  shouldIncrementEntities = false;
  incrementCounter = 0;
  hasFinished = false;
  frames = 0;
  prevTime = 0;

  animate() {
    if (!this.threeJsView || !this.stats || !this.controls || this.isDisposed) {
      return;
    }

    this.threeJsView.container.rotation.y += 0.001;
    this.threeJsView.render();
    this.stats.update();
    this.controls.update();
    requestAnimationFrame(() => this.animate());

    this.frames++;

    let time = performance.now();

    if (time >= this.prevTime + 1000) {
      this.incrementCounter++;

      let fps = (this.frames * 1000) / (time - this.prevTime);

      this.prevTime = time;
      this.frames = 0;

      if (this.framesCallback && this.lines.length > 0) {
        this.framesCallback(fps, this.lines.length - INITIAL_LINES, MAX_LINES);
      }
    }

    if (
      this.incrementCounter % INCREMENT_MOD === 0 &&
      this.shouldIncrementEntities &&
      this.lines.length < MAX_LINES
    ) {
      this.incrementCounter = 1;
      this.addLines(LINES_INCREMENT);
    }

    if (
      this.finishedAddingCallback &&
      this.lines.length >= MAX_LINES &&
      !this.hasFinished
    ) {
      this.finishedAddingCallback();
      this.hasFinished = true;
    }

    return time;
  }

  resize() {
    if (!this.threeJsView) {
      return;
    }

    this.threeJsView?.setSize(window.innerWidth, window.innerHeight);
    this.lines.forEach((line) => {
      if (this.threeJsView) {
        line.material.resolution.set(
          this.threeJsView.width,
          this.threeJsView.height
        );
      }
    });
  }

  async init(
    element: HTMLElement,
    {
      count,
      framesCallback,
      shouldIncrementEntities,
      finishedAddingCallback,
    }: {
      count?: number;
      framesCallback?: (
        fps: number,
        numberOfEntities: number,
        maxNumberOfEntities: number
      ) => void;
      finishedAddingCallback?: () => void;
      shouldIncrementEntities?: boolean;
    } = {}
  ) {
    const { stats, controls, threeJsView } = setupScene(element);

    this.finishedAddingCallback = finishedAddingCallback;
    this.shouldIncrementEntities = shouldIncrementEntities ?? false;
    this.framesCallback = framesCallback;
    this.threeJsView = threeJsView;
    this.stats = stats;
    this.controls = controls;
    controls.enableRotate = true;

    window.addEventListener("resize", this.resizeDelegate);
    this.animate();

    threeJsView.camera.position.z = 18000;
    threeJsView.camera.far = 6000000;
    threeJsView.camera.updateProjectionMatrix();

    if (!this.shouldIncrementEntities) {
      this.addLines(count ?? 500);
    } else {
      this.addLines(INITIAL_LINES);
    }
  }

  addLines(numberOfLines: number) {
    if (!this.threeJsView) {
      return;
    }

    let r = Math.random();
    let color = new Color();

    color.setHSL(r, 1.0, 0.5);

    for (let c = 0; c < numberOfLines; c++) {
      let line = new LineV2Skeleton();
      let p1 = getRandomPointOnSphere(14000);
      let p2 = getRandomPointOnSphere(14000);

      line.color.setRGB(color.r, color.g, color.b);
      line.start.set(p1.x, p1.y, p1.z);
      line.end.set(p2.x, p2.y, p2.z);
      line.update();
      line.material.resolution.set(
        this.threeJsView.width,
        this.threeJsView.height
      );
      line.material.linewidth = NumberUtils.random(0.1, 6);

      this.lines.push(line);
      this.threeJsView.add(line);
    }
  }

  dispose() {
    window.removeEventListener("resize", this.resizeDelegate);
    this.threeJsView?.dispose();
    this.isDisposed = true;
  }
}

function getRandomPointOnSphere(radius: number) {
  let x1;
  let x2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    x1 = Math.random();
    x2 = Math.random();
    x1 = 2 * (x1 - 0.5);
    x2 = 2 * (x2 - 0.5);

    if (x1 * x1 + x2 * x2 < 1) {
      break;
    }
  }

  let x = radius * x1 * Math.sqrt(1 - x1 * x1 - x2 * x2);
  let y = radius * x2 * Math.sqrt(1 - x1 * x1 - x2 * x2);
  let z = radius * (x1 * x1 + x2 * x2) - radius / 2;

  return { x, y, z };
}
