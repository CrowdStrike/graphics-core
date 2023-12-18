import { LineBezier2, LineBezier3, LineV2, NumberUtils , setupScene } from '@crowdstrike/graphics-core';
import * as dat from 'dat.gui';
import * as THREE from 'three';

import type { ThreeJSView } from '@crowdstrike/graphics-core';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type Stats from 'three/examples/jsm/libs/stats.module.js';

const MAX_LINES = 12000;
const INCREMENT_MOD = 8;
const LINES_INCREMENT = 1000;
const INITIAL_LINES = 10;

const LINES_PER_COLUMN = 10;
const LINE_WIDTH = 200;
const VERTICAL_SEPARATION = 200;
const START_AT_X = -200;
const START_AT_Y = -400;
const PADDING_X = 20;

export class LineTypesDemo {
  threeJsView?: ThreeJSView;
  gui?: dat.GUI;
  stats?: Stats;
  controls?: OrbitControls;
  renderer?: THREE.WebGLRenderer;
  isDisposed = false;
  lines: (LineV2 | LineBezier2 | LineBezier3)[] = [];
  axisLines: LineV2[] = [];
  resizeDelegate = () => this.resize();
  framesCallback?: (fps: number, numberOfEntities: number, maxNumberOfEntities: number) => void;
  finishedAddingCallback?: () => void;
  shouldIncrementEntities = false;
  incrementCounter = 0;
  hasFinished = false;
  frames = 0;
  prevTime = 0;

  tmpColor = new THREE.Color(0xffffff);
  tmpColor2 = new THREE.Color(0xffffff);
  tmpVec = new THREE.Vector3();

  demoParams = {
    angle: 0, // rads
    bgColor: 0x000000,
    worldUnits: true,
    showLabels: true,
    hasStartArrow: true,
    hasEndArrow: true,
    startArrowPosition: 0.0,
    startArrowRotation: 0.0,
    endArrowPosition: 1.0,
    endArrowRotation: 0.0,
    gradientOffset: 0.0,
    dashOffset: 0,
    dashScale: 1,
    dashSize: 1,
    animateGradientOffset: false,
    visibilityOffset: -0.1,
    animateVisibilityOffset: false,
    lineWidth: 1,
    endLineWidth: 6,
    debugMode: false,
    startColor: 0xff0000,
    endColor: 0xffc600,
    animateEndColor: false,
    labelText: '',
    labelSize: 20,
    labelColor: 0xffffff,
    addLines: () => {
      this.addLines(20);
    },
    jiggle: () => {
      this.lines.forEach((line) => {
        if (line instanceof LineBezier2 || line instanceof LineBezier3) {
          line.jiggle();
        }
      });
    },
    displace: () => {
      this.lines.forEach((line) => {
        if (line instanceof LineBezier2 || line instanceof LineBezier3) {
          line.displace();
        }
      });
    },
    shouldAnimateLinePositions: false,
    shouldAnimateControlPoints: false,
    removeLines: () => {
      this.removeLines(20);
    },
    disposeSome: () => {
      /* tslint-disable no-empty-function */
    },
    logStats: () => {
      /* tslint-disable no-empty-function */
    },
  };

  updateLineAngle() {
    this.lines.forEach((line) => {
      const r = LINE_WIDTH - PADDING_X * 2;

      const xCenter = line.start.x;
      const yCenter = line.start.y;

      const xEnd = xCenter + r * Math.cos(this.demoParams.angle);
      const yEnd = yCenter + r * Math.sin(this.demoParams.angle);

      this.tmpVec.set(xEnd, yEnd, line.end.z);
      line.setEnd(this.tmpVec);

      if (line instanceof LineBezier2 || line instanceof LineBezier3) {
        line.setControlPoint1Offsets(
          this.demoParams.shouldAnimateControlPoints
            ? 10 + Math.sin(this.demoParams.angle) * r
            : line._controlPoint1Offset,
          line._controlPoint1IntersectsLineAt
        );

        if (line instanceof LineBezier3) {
          line.setControlPoint2Offsets(
            this.demoParams.shouldAnimateControlPoints
              ? 10 + Math.sin(this.demoParams.angle) * r
              : line._controlPoint1Offset,
            line._controlPoint2IntersectsLineAt
          );
        }

        line.update(true);
      } else {
        line.update();
      }
    });
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

    if (this.demoParams.shouldAnimateLinePositions) {
      this.demoParams.angle = (this.demoParams.angle + 0.01) % (2 * Math.PI);
      this.updateLineAngle();
    }

    if (this.demoParams.animateGradientOffset) {
      this.demoParams.gradientOffset =
        Math.sin(this.threeJsView.renderer.info.render.frame * 0.01) * 0.5;
      this.lines.forEach((line) => {
        line.gradientOffset = this.demoParams.gradientOffset;
      });
    }

    if (this.demoParams.animateVisibilityOffset) {
      this.demoParams.visibilityOffset =
        Math.sin(this.threeJsView.renderer.info.render.frame * 0.01) * 1.1;
      this.lines.forEach((line) => {
        line.visibilityOffset = this.demoParams.visibilityOffset;
      });
    }

    if (this.demoParams.animateEndColor) {
      this.demoParams.endColor =
        (0xffffff * (Math.sin(this.threeJsView.renderer.info.render.frame * 0.01) + 1)) / 2;
      this.lines.forEach((line) => {
        line.setColor(
          this.tmpColor.set(this.demoParams.startColor),
          this.tmpColor2.set(this.demoParams.endColor)
        );
      });
    }

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

    if (this.finishedAddingCallback && this.lines.length >= MAX_LINES && !this.hasFinished) {
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
        line.material.resolution.set(this.threeJsView.width, this.threeJsView.height);
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
      framesCallback?: (fps: number, numberOfEntities: number, maxNumberOfEntities: number) => void;
      finishedAddingCallback?: () => void;
      shouldIncrementEntities?: boolean;
    } = {}
  ) {
    const { stats, controls, renderer, threeJsView } = setupScene(element);

    this.renderer = renderer;

    this.setupGUI();

    this.finishedAddingCallback = finishedAddingCallback;
    this.shouldIncrementEntities = shouldIncrementEntities ?? false;
    this.framesCallback = framesCallback;
    this.threeJsView = threeJsView;
    this.stats = stats;
    this.controls = controls;
    controls.enableRotate = false;
    this.threeJsView.container.rotation.y = 0;

    window.addEventListener('resize', this.resizeDelegate);

    threeJsView.camera.position.z = 800;
    threeJsView.camera.far = 6000000;
    threeJsView.camera.updateProjectionMatrix();

    if (!this.shouldIncrementEntities) {
      this.addLines(count ?? 500);
    } else {
      this.addLines(INITIAL_LINES);
    }

    this.animate();
  }

  removeLines(numberOfLines: number) {
    if (!this.threeJsView) return;

    const startIdx = this.lines.length - 1;
    const endIdx = Math.max(0, this.lines.length - numberOfLines);

    for (let c = startIdx; c >= endIdx; c--) {
      const lineToRemove = this.lines[c];

      if (lineToRemove) {
        // this.threeJsView.remove(lineToRemove);
        lineToRemove?.dispose();
      }

      this.lines.pop();
    }
  }

  addLines(numberOfLines: number) {
    if (!this.threeJsView) return;

    const lineOffset = this.lines.length;

    for (let c = lineOffset; c < lineOffset + numberOfLines; c++) {
      const columnIdx = ~~(c / LINES_PER_COLUMN);

      const rowIdx = c % LINES_PER_COLUMN;

      let line;

      let p1 = {
        x: START_AT_X + columnIdx * LINE_WIDTH - LINE_WIDTH / 2 + PADDING_X,
        y: START_AT_Y + rowIdx * VERTICAL_SEPARATION,
        z: 0,
      };
      let p2 = {
        x: START_AT_X + columnIdx * LINE_WIDTH + LINE_WIDTH / 2 - PADDING_X,
        y: START_AT_Y + rowIdx * VERTICAL_SEPARATION,
        z: 0,
      };

      const commonLineProps = {
        color: this.demoParams.startColor,
        endColor: this.demoParams.endColor,
        label: `${c}`,
        labelSize: 20,
        hasStartArrow: this.demoParams.hasStartArrow,
        hasEndArrow: this.demoParams.hasEndArrow,
        isDashed: Math.random() > 0.8,
      };

      switch (true) {
        case c % 3 === 0:
          line = new LineV2({
            ...commonLineProps,
            start: [p1.x, p1.y, p1.z],
            end: [p2.x, p2.y, p2.z],
          });

          break;
        case c % 3 === 1:
          line = new LineBezier2({
            numCurvePoints: 150,
            showDebugMode: this.demoParams.debugMode,
            ...commonLineProps,
            start: [p1.x, p1.y, p1.z],
            end: [p2.x, p2.y, p2.z],
            c1: [
              NumberUtils.getRandomInt(-VERTICAL_SEPARATION / 2, VERTICAL_SEPARATION / 2),
              Math.random(),
            ],
          });

          break;
        default:
          line = new LineBezier3({
            numCurvePoints: 150,
            showDebugMode: this.demoParams.debugMode,
            ...commonLineProps,
            start: [p1.x, p1.y, p1.z],
            end: [p2.x, p2.y, p2.z],
            c1: [
              NumberUtils.getRandomInt(-VERTICAL_SEPARATION / 2, VERTICAL_SEPARATION / 2),
              Math.random() * 0.5,
            ],
            c2: [
              NumberUtils.getRandomInt(-VERTICAL_SEPARATION / 2, VERTICAL_SEPARATION / 2),
              Math.random() * 0.5 + 0.5,
            ],
          });

          break;
      }

      line.geometry.computeBoundingBox();
      line.update();

      line.material.resolution.set(this.threeJsView.width, this.threeJsView.height);
      line.setLineWidths(NumberUtils.random(1, 6), NumberUtils.random(8, 12));

      this.lines.push(line);
      this.threeJsView.add(line);
    }
  }

  setupGUI() {
    this.gui = new dat.GUI();

    const sceneFolder = this.gui.addFolder('scene');
    const materialFolder = this.gui.addFolder('material');
    const animationFolder = this.gui.addFolder('animate');
    const lineElementsFolder = this.gui.addFolder('line elements');

    sceneFolder.closed = false;
    materialFolder.closed = false;
    animationFolder.closed = false;
    lineElementsFolder.closed = false;

    sceneFolder.addColor(this.demoParams, 'bgColor').onChange((v) => {
      this.renderer?.setClearColor(v);
    });

    sceneFolder.add(this.demoParams, 'addLines').onFinishChange(() => {
      statsPanel.fire();
    });

    sceneFolder.add(this.demoParams, 'removeLines').onFinishChange(() => {
      statsPanel.fire();
    });

    materialFolder.addColor(this.demoParams, 'startColor').onChange((v) => {
      this.lines.forEach((line) => {
        line.setColor(this.tmpColor.set(v), this.tmpColor2.set(this.demoParams.endColor));
      });
    });

    materialFolder
      .addColor(this.demoParams, 'endColor')
      .onChange((v) => {
        this.lines.forEach((line) => {
          line.setColor(this.tmpColor.set(this.demoParams.startColor), this.tmpColor2.set(v));
        });
      })
      .listen();

    materialFolder.add(this.demoParams, 'worldUnits').onChange((val) => {
      this.lines.forEach((line) => {
        line.material.worldUnits = val;
        line.material.needsUpdate = true;
      });
    });

    materialFolder
      .add(this.demoParams, 'dashOffset')
      .min(0)
      .max(100)
      .step(0.01)
      .onChange((val) => {
        this.lines.forEach((line) => {
          if (line.material.dashed) {
            line.material.dashOffset = val;
          }
        });
      });
    materialFolder
      .add(this.demoParams, 'dashScale')
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((val) => {
        this.lines.forEach((line) => {
          if (line.material.dashed) {
            line.material.dashScale = val;
          }
        });
      });
    materialFolder
      .add(this.demoParams, 'dashSize')
      .min(0)
      .max(1)
      .step(0.01)
      .onChange((val) => {
        this.lines.forEach((line) => {
          if (line.material.dashed) {
            line.material.dashSize = val;
          }
        });
      });

    materialFolder
      .add(this.demoParams, 'gradientOffset')
      .min(-0.5)
      .max(0.5)
      .step(0.001)
      .onChange((v) => {
        this.lines.forEach((line) => {
          line.gradientOffset = v;
        });
      })
      .listen();

    materialFolder
      .add(this.demoParams, 'visibilityOffset')
      .min(-0.1)
      .max(1.1)
      .step(0.001)
      .onChange((v) => {
        this.lines.forEach((line) => {
          line.visibilityOffset = v;
        });
      })
      .listen();

    materialFolder
      .add(this.demoParams, 'lineWidth')
      .min(1)
      .max(15)
      .step(0.01)
      .onChange((v) => {
        this.lines.forEach((line) => {
          line.setLineWidths(v, this.demoParams.endLineWidth);
        });
      });

    materialFolder
      .add(this.demoParams, 'endLineWidth')
      .min(1)
      .max(15)
      .step(0.01)
      .onChange((v) => {
        this.lines.forEach((line) => {
          line.setLineWidths(this.demoParams.lineWidth, v);
        });
      });

    materialFolder
      .add(this.demoParams, 'startArrowPosition')
      .min(0)
      .max(0.5)
      .step(0.01)
      .onChange((val) => {
        this.lines.forEach((line) => {
          line.startArrowPosition = val;
          line.update();
        });
      });

    materialFolder
      .add(this.demoParams, 'endArrowPosition')
      .min(0.5)
      .max(1)
      .step(0.01)
      .onChange((val) => {
        this.lines.forEach((line) => {
          line.endArrowPosition = val;
          line.update();
        });
      });

    materialFolder
      .add(this.demoParams, 'startArrowRotation')
      .min(0)
      .max(Math.PI)
      .step(Math.PI / 180)
      .onChange((val) => {
        this.lines.forEach((line) => {
          line.startArrowRotation = val;
          line.update();
        });
      });

    materialFolder
      .add(this.demoParams, 'endArrowRotation')
      .min(0)
      .max(Math.PI)
      .step(Math.PI / 180)
      .onChange((val) => {
        this.lines.forEach((line) => {
          line.endArrowRotation = val;
          line.update();
        });
      });

    animationFolder.add(this.demoParams, 'animateVisibilityOffset').name('visibility offset');
    animationFolder.add(this.demoParams, 'animateGradientOffset').name('gradient offset');
    animationFolder.add(this.demoParams, 'animateEndColor').name('end color');
    animationFolder.add(this.demoParams, 'shouldAnimateLinePositions').name('line positions');
    animationFolder.add(this.demoParams, 'shouldAnimateControlPoints').name('control points');
    animationFolder.add(this.demoParams, 'jiggle').name('jiggle');
    animationFolder.add(this.demoParams, 'displace').name('displace');

    lineElementsFolder
      .add(this.demoParams, 'angle')
      .min(0)
      .max(2 * Math.PI)
      .step(0.01)
      .onChange(() => {
        this.updateLineAngle();
      })
      .listen();

    lineElementsFolder.add(this.demoParams, 'showLabels').onChange((val) => {
      this.lines.forEach((line) => {
        line.labelIsVisible = val;
      });
    });

    lineElementsFolder.add(this.demoParams, 'hasStartArrow').onChange((v) => {
      this.lines.forEach((line) => {
        line.isStartArrowVisible = v;
        line.hasStartArrow = v;
      });
    });

    lineElementsFolder.add(this.demoParams, 'hasEndArrow').onChange((v) => {
      this.lines.forEach((line) => {
        line.isEndArrowVisible = v;
        line.hasEndArrow = v;
      });
    });

    lineElementsFolder.add(this.demoParams, 'debugMode').onChange((v) => {
      this.lines.forEach((line) => {
        line.enableDebugging(v);
      });
    });

    lineElementsFolder.addColor(this.demoParams, 'labelColor').onChange((v) => {
      this.lines.forEach((line) => {
        line.setLabelColor(v);
      });
    });

    lineElementsFolder.add(this.demoParams, 'labelText').onChange((v) => {
      this.lines.forEach((line) => {
        line.setLabel(v);
      });

      statsPanel.fire();
    });

    lineElementsFolder
      .add(this.demoParams, 'labelSize')
      .min(10)
      .max(48)
      .step(1)
      .onChange((v) => {
        this.lines.forEach((line) => {
          line.labelSize = v;
        });

        statsPanel.fire();
      });

    const statsPanel = this.gui.add(this.demoParams, 'logStats').name('click to show render stats');

    statsPanel.onChange(() => {
      const {
        triangles,
        memory: { geometries, textures },
        calls,
      } = this.logStats();

      statsPanel.name(`${triangles} T / ${geometries} G / ${textures} TX / ${calls} C`);
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
    this.gui?.destroy()
  }
}
