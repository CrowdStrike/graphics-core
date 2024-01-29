import {
  DefaultLineBezier2Settings,
  GraphicsV2EdgeController,
  LineBezier2,
  setupScene,
} from '@crowdstrike/graphics-core';
import * as dat from 'dat.gui';
import * as THREE from 'three';

import type {
  LineBezier2Settings,
  LineBezier3,
  LineBezier3Settings,
  LineV2,
  LineV2Settings,
  ThreeJSView,
} from '@crowdstrike/graphics-core';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type Stats from 'three/examples/jsm/libs/stats.module.js';

const MAX_LINES = 12000;
const INITIAL_LINES = 10;

interface LayoutVertex {
  x: number;
  y: number;
}

interface LayoutEdge {
  source: LayoutVertex;
  target: LayoutVertex;
}

interface Layout {
  vertices: LayoutVertex[];
  edges: LayoutEdge[];
}

export class LineEntitiesDemo {
  threeJsView?: ThreeJSView;
  gui?: dat.GUI;
  stats?: Stats;
  controls?: OrbitControls;
  renderer?: THREE.WebGLRenderer;
  isDisposed = false;
  axisLines: LineV2[] = [];
  resizeDelegate = () => this.resize();
  framesCallback?: (fps: number, numberOfEntities: number, maxNumberOfEntities: number) => void;
  finishedAddingCallback?: () => void;
  incrementCounter = 0;
  hasFinished = false;
  frames = 0;
  prevTime = 0;

  demoParams = {
    bgColor: 0x000000,
    worldUnits: true,
    showLabels: true,
    hasStartArrow: false,
    hasEndArrow: true,
    startArrowPosition: 0.0,
    endArrowPosition: 1.0,
    visibilityOffset: -0.1,
    startWidth: 1,
    endWidth: 6,
    color: 0xff0000,
    endColor: 0xffc600,
    label: 'test',
    labelSize: 20,
    labelColor: 0xffffff,
  };

  layout: Layout;
  lines: (LineV2 | LineBezier2 | LineBezier3)[] = [];
  entities: (
    | GraphicsV2EdgeController<LineBezier3, LineBezier3Settings>
    | GraphicsV2EdgeController<LineBezier2, LineBezier2Settings>
    | GraphicsV2EdgeController<LineV2, LineV2Settings>
  )[] = [];

  tmpColor = new THREE.Color(0xffffff);
  tmpColor2 = new THREE.Color(0xffffff);
  tmpVec = new THREE.Vector3();

  constructor() {
    this.layout = this.makeLayout();
  }

  animate() {
    if (!this.threeJsView || !this.stats || !this.controls || this.isDisposed) {
      return;
    }

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

    return time;
  }

  resize() {
    if (!this.threeJsView) {
      return;
    }

    this.threeJsView?.setSize(window.innerWidth, window.innerHeight);
    this.lines.forEach((line) => {
      if (this.threeJsView) {
        line.material.resolution.set(this.threeJsView.width, this.threeJsView.height);
      }
    });
  }

  async init(element: HTMLElement) {
    const { stats, controls, renderer, threeJsView } = setupScene(element);

    this.renderer = renderer;

    this.setupGUI();

    this.threeJsView = threeJsView;
    this.stats = stats;
    this.controls = controls;
    controls.enableRotate = false;
    this.threeJsView.container.rotation.y = 0;

    window.addEventListener('resize', this.resizeDelegate);

    threeJsView.camera.position.z = 800;
    threeJsView.camera.far = 6000000;
    threeJsView.camera.updateProjectionMatrix();

    this.renderLayout();

    this.animate();
  }

  makeLayout(): Layout {
    const vertices = [
      {
        x: 0,
        y: 0,
      },
      {
        x: 200,
        y: -50,
      },
      {
        x: 200,
        y: 0,
      },
      {
        x: 200,
        y: 50,
      },

      {
        x: 200,
        y: 200,
      },
      {
        x: 400,
        y: 250,
      },
      {
        x: 400,
        y: 200,
      },
      {
        x: 400,
        y: 150,
      },
      {
        x: 200,
        y: 250,
      },
      {
        x: 200,
        y: 150,
      },
    ];

    const edges = [
      {
        source: vertices[0] as LayoutVertex,
        target: vertices[1] as LayoutVertex,
      },
      {
        source: vertices[0] as LayoutVertex,
        target: vertices[2] as LayoutVertex,
      },
      {
        source: vertices[0] as LayoutVertex,
        target: vertices[3] as LayoutVertex,
      },
      {
        source: vertices[0] as LayoutVertex,
        target: vertices[4] as LayoutVertex,
      },
      {
        source: vertices[4] as LayoutVertex,
        target: vertices[5] as LayoutVertex,
      },
      {
        source: vertices[4] as LayoutVertex,
        target: vertices[6] as LayoutVertex,
      },
      {
        source: vertices[4] as LayoutVertex,
        target: vertices[7] as LayoutVertex,
      },
      {
        source: vertices[4] as LayoutVertex,
        target: vertices[8] as LayoutVertex,
      },
      {
        source: vertices[4] as LayoutVertex,
        target: vertices[9] as LayoutVertex,
      },
    ];

    return {
      vertices,
      edges,
    };
  }

  renderLayout() {
    this.layout.edges.forEach((edge) => {
      const { source, target } = edge;
      const entity = new GraphicsV2EdgeController<LineBezier2, LineBezier2Settings>({
        line: new LineBezier2({
          ...new DefaultLineBezier2Settings(),
          numCurvePoints: 150,
          startWidth: this.demoParams.startWidth,
          endWidth: this.demoParams.endWidth,
          color: this.demoParams.color,
          endColor: this.demoParams.endColor,
          hasEndArrow: this.demoParams.hasEndArrow,
          label: this.demoParams.label,
          labelSize: 14,
          start: [source.x, source.y, 0],
          end: [target.x, target.y, 0],
          c1: [source.y > target.y ? 40 : -40, 0.95],
        }),
      });

      entity.line.enableDebugging(true);

      // entity.line.update(true);
      entity.update();
      this.threeJsView?.add(entity.line);

      this.entities.push(entity);
    });
  }

  setupGUI() {
    this.gui = new dat.GUI();

    const sceneFolder = this.gui.addFolder('scene');
    const materialFolder = this.gui.addFolder('material');
    const lineElementsFolder = this.gui.addFolder('line elements');

    sceneFolder.addColor(this.demoParams, 'bgColor').onChange((v) => {
      this.renderer?.setClearColor(v);
    });

    materialFolder.addColor(this.demoParams, 'color').onChange((val) => {
      this.entities.forEach((entity) => {
        entity.updateConfig({ color: val });
      });
    });

    materialFolder
      .addColor(this.demoParams, 'endColor')
      .onChange((val) => {
        this.entities.forEach((entity) => {
          entity.updateConfig({ endColor: val });
        });
      })
      .listen();

    materialFolder
      .add(this.demoParams, 'visibilityOffset')
      .min(-0.1)
      .max(1.1)
      .step(0.001)
      .onChange((val) => {
        this.entities.forEach((entity) => {
          entity.line.visibilityOffset = val;
        });
      })
      .listen();

    materialFolder
      .add(this.demoParams, 'startWidth')
      .min(1)
      .max(15)
      .step(0.01)
      .onChange((val) => {
        this.entities.forEach((entity) => {
          entity.updateConfig({ startWidth: val });
        });
      });

    materialFolder
      .add(this.demoParams, 'endWidth')
      .min(1)
      .max(15)
      .step(0.01)
      .onChange((val) => {
        this.entities.forEach((entity) => {
          entity.updateConfig({ endWidth: val });
        });
      });

    materialFolder
      .add(this.demoParams, 'startArrowPosition')
      .min(0)
      .max(0.5)
      .step(0.01)
      .onChange((val) => {
        this.entities.forEach((entity) => {
          entity.updateConfig({ startArrowPosition: val });
        });
      });

    materialFolder
      .add(this.demoParams, 'endArrowPosition')
      .min(0.5)
      .max(1)
      .step(0.01)
      .onChange((val) => {
        this.entities.forEach((entity) => {
          entity.updateConfig({ endArrowPosition: val });
        });
      });

    lineElementsFolder.add(this.demoParams, 'label').onChange((val) => {
      this.entities.forEach((entity) => {
        entity.updateConfig({ label: val });
      });
    });
  }

  logStats() {
    if (!this.threeJsView) {
      throw new Error('threeJsView not existent');
    }

    const {
      memory,
      render: { calls, triangles, points, lines },
    } = this.threeJsView.renderer.info;

    return { memory, calls, triangles, points, lines };
  }

  dispose() {
    window.removeEventListener('resize', this.resizeDelegate);
    this.threeJsView?.dispose();
    this.isDisposed = true;
    this.gui?.destroy();
  }
}
