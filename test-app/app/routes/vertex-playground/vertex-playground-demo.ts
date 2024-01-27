/**
 * TODO
 * - Add way to disambiguate which UI overlay has an interaction
 * - Parameterize overlay configuration in dat.gui
 */

import {
  DEFAULT_UI_OFFSETS,
  generateHorizontalUiSlots,
  generateVerticalUiSlots,
  GL_MAX_TEXTURE_IMAGE_UNITS,
  GraphicsV2VertexController,
  InstancedIconAttributes,
  InstancedMeshWithController,
  InstancedTextAlignment,
  MouseControls,
  MouseControlsEvent,
  MousePickerEvents,
  NumberUtils,
  setupScene,
  TextStyle,
} from '@crowdstrike/graphics-core';
import * as dat from 'dat.gui';
import gsap, { Power3 } from 'gsap';
import IconTextureAtlas from 'test-app-for-graphics-core/assets/icon-texture-atlas.png';
import iconCoordinates from 'test-app-for-graphics-core/utils/coordinates';
import * as THREE from 'three';

import type {
  InstancedInteractionAttributes,
  InstancedTextAttributes,
  InteractionCallbacks,
  OverlayContent,
  ThreeJSView,
} from '@crowdstrike/graphics-core';
import type Stats from 'three/examples/jsm/libs/stats.module.js';

export class VertexPlaygroundDemo {
  threeJsView?: ThreeJSView;
  gui?: dat.GUI;
  stats?: Stats;
  controls?: MouseControls;
  zoomPercent = 1;
  renderer?: THREE.WebGLRenderer;
  isDisposed = false;
  resizeDelegate = () => this.resize();

  iconTextureAtlas?: THREE.Texture;

  sharedIconAttributesForVertices?: InstancedIconAttributes;

  incrementCounter = 0;
  frames = 0;
  prevTime = 0;

  /**
   * interaction states
   */
  selectedIdx = -1;
  rolledOverIdx = -1;

  entities: GraphicsV2VertexController[] = [];

  textStyle: TextStyle = new TextStyle();

  demoParams = {
    bgColor: 0x000000,
    labelColor: 0xffffff,
    descriptionColor: 0xaaaaaa,
    highlightColor: 0x5fcc91,
    showTextUnderIcon: true,
    updateOverlayContent: () => {
      this.entities.forEach((entity) => {
        entity.updateOverlayContent(this.randomizeOverlays(entity.state.icon));
        entity.update();
      });
    },
    animateSize: () => {
      this.entities.forEach((entity) => {
        const { baseSize: size } = entity;

        const targetSize = NumberUtils.getRandomInt(size - 6, size + 6);

        gsap.fromTo(
          {},
          { size },
          {
            size: targetSize,
            ease: Power3.easeInOut,
            duration: 1,
            repeat: 1,
            yoyo: true,
            onUpdate() {
              const size = +gsap.getProperty(this['targets']()[0], 'size');

              entity.baseSize = size;
              entity.update();
            },
          },
        );
      });
    },
    animateUiSlots: () => {
      this.uiLayerSlotMap.forEach((locationArray, key) => {
        if (key !== 'badge_below') return;

        const positions = locationArray.map((l) => l.map((_) => ({ ..._, x: _.x * 1.4 })));

        this.entities.forEach((entity: GraphicsV2VertexController) => {
          entity.animateUiSlotsTo('badge_below', positions);
          setTimeout(() => {
            entity.animateUiSlotsTo('badge_below', locationArray);
          }, 1000);

          setTimeout(() => {
            entity.uiLayerSlotMapOverrides.delete('badge_below');
            entity.update();
          }, 2000);
        });
      });
    },
    moveVertices: () => {
      this.entities.forEach((entity) => {
        const { x, y, z } = entity.position;

        const targetX = NumberUtils.getRandomInt(x - 200, x + 200);

        gsap.fromTo(
          {},
          { x, y, z },
          {
            x: targetX,
            y,
            z,
            ease: Power3.easeInOut,
            duration: 1,
            repeat: 1,
            yoyo: true,
            onUpdate(context) {
              const x = +gsap.getProperty(this['targets']()[0], 'x');
              const y = +gsap.getProperty(this['targets']()[0], 'y');
              const z = +gsap.getProperty(this['targets']()[0], 'z');

              if (Math.random() < 0.01) {
                entity.updateOverlayContent(context.randomizeOverlays());
              }

              entity.position.set(x, y, z);
              entity.update();
            },
            onUpdateParams: [this],
          },
        );
      });
    },
    randomColors: () => {
      this.entities.forEach((entity) => {
        const newOverlays = this.randomizeOverlays();

        Object.entries(newOverlays).forEach(([, slots]) => {
          slots.forEach((overlay) => {
            overlay.color = overlay.color * Math.random();
          });
        });

        entity.updateOverlayContent(newOverlays);
        entity.update();
      });
    },
    removeSome: () => {
      const indicesToRemove: number[] = [];

      this.entities.forEach((entity, idx) => {
        if (Math.random() < 0.2) {
          entity.dispose();
          indicesToRemove.push(idx);
        }
      });

      indicesToRemove.reverse();
      indicesToRemove.forEach((idx) => {
        this.entities.splice(idx, 1);
      });
    },
    onShowDebugBounds: (shouldShowDebugBounds: boolean) => {
      if (this.entities.length > 0) {
        this.uiAttributes.forEach((a) => {
          a.mesh.material.defines['USE_DEBUG_BOUNDS'] = shouldShowDebugBounds;
          a.mesh.material.needsUpdate = true;
        });
      }
    },
    logStats: () => {
      // eslint-disable-next-line no-console
      console.log(this.logStats());
    },
    showDebugBounds: false,
    visible: true,
  };

  constructor() {
    this.textStyle.name = 'style-name';
    this.textStyle.fontSize = 12;
    this.textStyle.pixelDensity = 2;
    this.textStyle.alignment = TextStyle.ALIGN_CENTER;
    this.textStyle.fontName = 'Helvetica Neue';
  }

  animate() {
    if (!this.threeJsView || !this.stats || !this.controls || this.isDisposed) {
      return;
    }

    this.threeJsView.render();
    this.controls?.render();
    this.stats.update();
    requestAnimationFrame(() => this.animate());

    this.frames++;

    let time = performance.now();

    if (time >= this.prevTime + 1000) {
      this.incrementCounter++;

      this.prevTime = time;
      this.frames = 0;
    }

    return time;
  }

  resize() {
    if (!this.threeJsView) {
      return;
    }

    this.threeJsView?.setSize(window.innerWidth, window.innerHeight);
  }

  async init(element: HTMLElement) {
    const { stats, renderer, controls, threeJsView } = setupScene(element);

    this.renderer = renderer;

    this.setupGUI();

    // in order to use MouseControls, we should get rid of the previously
    // instantiated THREE.OrbitControls
    controls.dispose();

    this.controls = new MouseControls({
      initialScale: 0.65,
      maxScale: 1,
      minScale: 0.4,
      object3DContainer: threeJsView.container,
      shouldDoubleRender: true,
      threeView: threeJsView,
    });

    this.controls.throwDampingFactor = 0.1;
    this.controls.throwThreshold = 2;

    this.controls.addEventListener(MouseControlsEvent.ZOOM_COMPLETE, this.onZoom, this);

    this.threeJsView = threeJsView;
    this.stats = stats;
    // this.controls = controls;
    // controls.enableRotate = false;

    this.threeJsView.container.rotation.y = 0;

    window.addEventListener('resize', this.resizeDelegate);

    threeJsView.camera.position.z = 800;
    threeJsView.camera.far = 6000000;
    threeJsView.camera.updateProjectionMatrix();


    threeJsView.mousePicker.addEventListener(MousePickerEvents.MOUSE_UP, this.onMouseUp, this);
    threeJsView.mousePicker.addEventListener(MousePickerEvents.MOUSE_DOWN, this.onMouseDown, this);
    threeJsView.mousePicker.addEventListener(MousePickerEvents.ROLL_OUT, this.onRollOut, this);
    threeJsView.mousePicker.addEventListener(MousePickerEvents.ROLL_OVER, this.onRollOver, this);
    threeJsView.mousePicker.addEventListener(MousePickerEvents.MOUSE_WHEEL, this.onZoom, this);

    const loader = new THREE.TextureLoader();

    this.iconTextureAtlas = await new Promise((resolve) => {
      loader.load(IconTextureAtlas, (d) => {
        resolve(d);
      });
    });

    this.sharedIconAttributesForVertices = new InstancedIconAttributes({
      maxTextureArraySize: GL_MAX_TEXTURE_IMAGE_UNITS,
      textureAtlas: this.iconTextureAtlas,
    });

    this.renderLayout();

    this.sharedIconAttributesForVertices.addMeshToScene(threeJsView.container);

    try {
      if (this.sharedIconAttributesForVertices) {
        const { max: iconsMax } = this.sharedIconAttributesForVertices.dimensions;

        this.sharedIconAttributesForVertices.translate(-iconsMax.x / 2, -iconsMax.y / 2);
      }
    } catch {
      //
    }

    this.animate();
  }

  randomizeOverlays(baseIcon?: string) {
    const numInteractions = NumberUtils.getRandomInt(0, 3);
    const numBadgeBelow = NumberUtils.getRandomInt(0, 5);

    return {
      badge_below: [
        { icon: 'circle-squares', color: 0xdddddd },
        { icon: 'arrow-and-circle', color: 0xdddddd },
        { icon: 'concentric-circles', color: 0xdddddd },
        { icon: 'concentric-circles', color: 0xdddddd },
        { icon: 'concentric-circles', color: 0xdddddd },
      ].slice(0, numBadgeBelow),
      label: [
        {
          text: baseIcon ?? 'label',
          color: this.demoParams.labelColor,
        },
      ],
      description: [
        {
          text: `i: ${numInteractions} / bb: ${numBadgeBelow}`,
          color: this.demoParams.descriptionColor,
          isVisible: false,
        },
      ],
      interaction_plane: [
        {
          color: 0x444444,
          ringColor: 0xdddddd,
        },
      ],
      interactions: [
        {
          icon: 'settings',
          color: 0xaaaaaa,
          interactions: {
            onClick: (e: GraphicsV2VertexController, layerAttributes: InstancedIconAttributes) => {
              // console.log('onClick', e.instanceIdx);

              const q = new THREE.Quaternion();

              const axisZ = new THREE.Vector3(0, 1, 0);

              q.setFromAxisAngle(axisZ, 0);

              gsap.fromTo(
                {},
                { z: 0 },
                {
                  z: 4 * Math.PI,
                  onUpdate() {
                    const z = +gsap.getProperty(this['targets']()[0], 'z');

                    q.setFromAxisAngle(axisZ, z);
                    layerAttributes.setRotation(e.instanceIdx, q);
                  },
                },
              );
            },
            onRollover: (e: GraphicsV2VertexController) => {
              e;
              // console.log('onRollover', e.instanceIdx);
            },

            onRollout: (e: GraphicsV2VertexController) => {
              e;
              // console.log('onRollout', e.instanceIdx);
            },
          } satisfies InteractionCallbacks<InstancedIconAttributes>,
        },
        {
          icon: 'circle-minus',
          color: 0xaaaaaa,
        },
        {
          icon: 'hexagon-plus',
          color: 0xaaaaaa,
        },
      ].slice(0, numInteractions),
      disposition: [
        {
          icon: 'dot-12',
          color: 0x00ff00,
        },
      ],
      disposition_background: [
        {
          icon: 'dot-12',
          color: this.demoParams.bgColor,
        },
      ],
    } satisfies OverlayContent;
  }

  renderLayout() {
    if (!this.sharedIconAttributesForVertices) return;

    const iconNames = Object.keys(iconCoordinates);

    const size = 24;

    for (let idx = 0; idx < 500; idx++) {
      const id = `${Math.random()}`;
      const baseIcon = iconNames[NumberUtils.getRandomInt(0, iconNames.length - 1)];

      if (!baseIcon) continue;

      // it's possible a bug might show up if element N introduces a slot
      // that the previous ones don't have
      // (it could mess up the recursive structure of this.sharedIconAttributesForVertices)
      const slots = this.generateSlots();

      const entity = new GraphicsV2VertexController({
        id,
        size,
        icon: baseIcon,
        color: 0xffffff,
        overlays: this.randomizeOverlays(baseIcon),
        slots,
        iconCoordinates,
        iconAttributes: this.sharedIconAttributesForVertices,
        textStyle: this.textStyle,
      });

      this.entities.push(entity);
      this.updateTextConfigAccordingToTextOrientation();
    }

    this.entities.forEach((entity, idx) => {
      const posX = ~~(idx / 10) * 200;
      const posY = (idx % 10) * 200;
      const posZ = 0;

      entity.position.set(posX, posY, posZ);
      entity.update();
    });

    this.demoParams.onShowDebugBounds(this.demoParams.showDebugBounds);

    if (this.interactionAttributes) {
      this.interactionAttributes.mesh.position.z =
        this.sharedIconAttributesForVertices.mesh.position.z - 100;
      this.interactionAttributes.shouldDispatchMouseEvents = false;
    }
  }

  setupGUI() {
    this.gui = new dat.GUI();

    const sceneFolder = this.gui.addFolder('scene');
    const vertexElementsFolder = this.gui.addFolder('vertex elements');
    const colorFolder = this.gui.addFolder('colors');
    const overlayFolder = this.gui.addFolder('overlays');
    const debugFolder = this.gui.addFolder('debug');

    colorFolder.addColor(this.demoParams, 'highlightColor').onChange((v: number) => {
      this.entities.forEach((entity) => {
        entity.updateOverlayState('interaction_plane', { ringColor: v });

        entity.update();
      });
    });
    colorFolder.addColor(this.demoParams, 'descriptionColor').onChange((v: number) => {
      this.entities.forEach((entity) => {
        entity.updateOverlayState('description', { color: v });
        entity.update();
      });
    });
    colorFolder.addColor(this.demoParams, 'labelColor').onChange((v: number) => {
      this.entities.forEach((entity) => {
        entity.updateState({ color: v });

        entity.overlayContent['badge_below']?.forEach((_, idx) => {
          entity.updateOverlayState(`badge_below`, { color: v }, idx);
        });
        entity.update();
      });
    });

    Object.entries(DEFAULT_UI_OFFSETS).forEach(([layerName, value]) => {
      const f = overlayFolder.addFolder(layerName);

      f.add({ isVisible: true }, 'isVisible').onChange((e: boolean) => {
        this.entities.forEach((entity) => {
          try {
            const idx = +layerName.slice(-1);

            entity.updateOverlayState(layerName.slice(0, -2), { isVisible: e }, idx);
            entity.update();
          } catch {
            // some layers might not have this
          }
        });
      });

      f.add(value, 'x').onChange((v: number) => {
        // @ts-expect-error no strong type inference on Object.entries
        DEFAULT_UI_OFFSETS[layerName].x = v;

        // GraphicsV2VertexController.registerUiSlots(generateDefaultUiSlots());
        this.entities.forEach((entity) => {
          entity.registerUiSlots(this.generateSlots());
          entity.update();
        });
      });
      f.add(value, 'y').onChange((v: number) => {
        // @ts-expect-error no strong type inference on Object.entries
        DEFAULT_UI_OFFSETS[layerName].y = v;

        // GraphicsV2VertexController.registerUiSlots(generateDefaultUiSlots());
        this.entities.forEach((entity) => {
          entity.registerUiSlots(this.generateSlots());
          entity.update();
        });
      });
    });

    debugFolder
      .add(this.demoParams, 'showDebugBounds')
      .onChange((e) => this.demoParams.onShowDebugBounds(e));

    debugFolder.add(this.demoParams, 'logStats');

    sceneFolder.addColor(this.demoParams, 'bgColor').onChange((v: number) => {
      this.renderer?.setClearColor(v);
      this.entities.forEach((entity) => {
        entity.updateOverlayState('disposition_background', { color: v });
        entity.update();
      });
    });

    vertexElementsFolder.add(this.demoParams, 'updateOverlayContent');
    vertexElementsFolder.add(this.demoParams, 'visible').onChange((e) => {
      this.entities.forEach((entity) => entity.setVisibility(e));
    });
    vertexElementsFolder.add(this.demoParams, 'showTextUnderIcon').onChange(() => {
      this.updateTextConfigAccordingToTextOrientation();
      this.entities.forEach((entity) => {
        entity.registerUiSlots(this.generateSlots());
        entity.update();
      });
    });
    vertexElementsFolder.add(this.demoParams, 'moveVertices');
    vertexElementsFolder.add(this.demoParams, 'animateSize');
    vertexElementsFolder.add(this.demoParams, 'animateUiSlots');
    vertexElementsFolder.add(this.demoParams, 'removeSome');
    vertexElementsFolder.add(this.demoParams, 'randomColors');
    vertexElementsFolder.open();
  }

  logStats() {
    if (!this.threeJsView) {
      throw new Error("threeJsView doesn't exist");
    }

    const {
      memory,
      render: { calls, triangles, points, lines },
    } = this.threeJsView.renderer.info;

    return { memory, calls, triangles, points, lines };
  }

  updateTextConfigAccordingToTextOrientation() {
    try {
      if (this.labelAttributes) {
        this.labelAttributes.updateTextConfig({
          alignment: this.demoParams.showTextUnderIcon
            ? InstancedTextAlignment.middle
            : InstancedTextAlignment.start,
          truncationLength: 15,
          truncationStrategy: 'end',
          pixelDensity: 3,
        });
      }

      if (this.descriptionAttributes) {
        this.descriptionAttributes.updateTextConfig({
          alignment: this.demoParams.showTextUnderIcon
            ? InstancedTextAlignment.middle
            : InstancedTextAlignment.start,
          truncationLength: 15,
          truncationStrategy: 'end',
          pixelDensity: 3,
        });
      }
    } catch {
      //
    }
  }

  generateSlots() {
    if (this.demoParams.showTextUnderIcon) {
      return generateVerticalUiSlots();
    } else {
      return generateHorizontalUiSlots();
    }
  }

  get interactionAttributes() {
    if (!this.entities[0]) {
      throw new Error('interactionAttributes: failed to retrieve');
    }

    return this.entities[0].iconAttributes?.getUiLayer<InstancedInteractionAttributes>(
      GraphicsV2VertexController.getLayerSlotName('interaction_plane', 0),
    );
  }

  get labelAttributes() {
    if (!this.entities[0]) {
      throw new Error('labelAttributes: failed to retrieve');
    }

    return this.entities[0].getUiLayer<InstancedTextAttributes>(
      GraphicsV2VertexController.getLayerSlotName('label', 0),
    );
  }

  get descriptionAttributes() {
    if (!this.entities[0]) {
      throw new Error('descriptionAttributes: failed to retrieve');
    }

    return this.entities[0].getUiLayer<InstancedTextAttributes>(
      GraphicsV2VertexController.getLayerSlotName('description', 0),
    );
  }

  get uiAttributes() {
    if (!this.entities[0]?.uiAttributes) {
      throw new Error('uiAttributes: failed to retrieve');
    }

    return this.entities[0]?.uiAttributes;
  }

  get uiLayerSlotMap() {
    if (this.entities.length > 0 && this.entities[0]?.uiLayerSlotMap) {
      return this.entities[0].uiLayerSlotMap;
    } else {
      throw new Error('uiLayerSlotMap: no entities exist');
    }
  }

  onMouseUp(e: MousePickerEvents) {
    const { instanceId } = e as MousePickerEvents;

    if (instanceId === null) return;
    if (!this.sharedIconAttributesForVertices) return;

    if (this.selectedIdx !== instanceId) {
      const entity = this.entities.find((e) => e.instanceIdx === this.selectedIdx);

      if (entity) {
        entity.updateState({ color: this.demoParams.labelColor });
        entity.updateOverlayState('label', { color: this.demoParams.labelColor });
        entity.overlayContent['badge_below']?.forEach((_, idx) => {
          entity.updateOverlayState(`badge_below`, { color: this.demoParams.labelColor }, idx);
        });
        entity.update();

        const oldBadgePositions = this.uiLayerSlotMap.get('badge_below');
        const oldLabelPositions = this.uiLayerSlotMap.get('label');
        const oldDescriptionPositions = this.uiLayerSlotMap.get('description');

        if (oldBadgePositions) {
          entity.animateUiSlotsTo('badge_below', oldBadgePositions);
        }

        if (oldLabelPositions) {
          entity.animateUiSlotsTo('label', oldLabelPositions);
        }

        if (oldDescriptionPositions) {
          entity.animateUiSlotsTo('description', oldDescriptionPositions);
        }
      }

      this.interactionAttributes?.setDisplayAt(this.selectedIdx as number, false);
      this.interactionAttributes?.setHoverAt(this.selectedIdx as number, false);
      this.interactionAttributes?.setSelectAt(this.selectedIdx as number, false);
      this.selectedIdx = instanceId;
    }

    this.interactionAttributes?.setDisplayAt(instanceId as number, true);
    this.interactionAttributes?.setHoverAt(instanceId as number, true);
    this.interactionAttributes?.setSelectAt(instanceId as number, true);

    this.selectedIdx = instanceId;

    const entity = this.entities.find((e) => e.instanceIdx === this.selectedIdx);

    if (entity) {
      if (e instanceof MousePickerEvents && e.object instanceof InstancedMeshWithController) {
        const controller = e.object?.attributesController;

        if (controller instanceof InstancedIconAttributes && controller.uiConfig) {
          controller?.uiConfig.name &&
            entity.runInteractionsFor(controller.uiConfig.name, 'onClick');
        }
      }
    }
  }

  onMouseDown(e: MousePickerEvents ) {
    const { instanceId } = e as MousePickerEvents;

    if (instanceId === null) return;
  }

  onRollOut(e: MousePickerEvents ) {
    const { instanceId } = e as MousePickerEvents;

    if (instanceId === this.rolledOverIdx) {
      this.rolledOverIdx = -1;

      const entity = this.entities.find((e) => e.instanceIdx === instanceId);

      if (entity) {
        gsap.killTweensOf(entity);
      }
    }

    if (instanceId === null) return;
    if (!this.sharedIconAttributesForVertices) return;

    if (instanceId !== this.selectedIdx) {
      this.interactionAttributes?.setDisplayAt(instanceId as number, false);
      this.interactionAttributes?.setHoverAt(instanceId as number, false);
      this.interactionAttributes?.setSelectAt(instanceId as number, false);
    }

    const entity = this.entities.find((e) => e.instanceIdx === instanceId);

    if (entity && instanceId !== this.selectedIdx) {
      entity.updateState({ color: this.demoParams.labelColor });
      entity.updateOverlayState('label', { color: this.demoParams.labelColor });
      entity.overlayContent['badge_below']?.forEach((_, idx) => {
        entity.updateOverlayState(`badge_below`, { color: this.demoParams.labelColor }, idx);
      });
      entity.update();

      const oldBadgePositions = entity.uiLayerSlotMap.get('badge_below');
      const oldLabelPositions = entity.uiLayerSlotMap.get('label');
      const oldDescriptionPositions = entity.uiLayerSlotMap.get('description');

      if (oldBadgePositions) {
        entity.animateUiSlotsTo('badge_below', oldBadgePositions);
      }

      if (oldLabelPositions) {
        entity.animateUiSlotsTo('label', oldLabelPositions);
      }

      if (oldDescriptionPositions) {
        entity.animateUiSlotsTo('description', oldDescriptionPositions);
      }
    }
  }

  onRollOver(e: MousePickerEvents ) {
    const { instanceId } = e as MousePickerEvents;

    if (instanceId === null) {
      this.rolledOverIdx = -1;

      return;
    }

    if (!this.sharedIconAttributesForVertices) return;

    this.interactionAttributes?.setDisplayAt(instanceId as number, true);
    this.interactionAttributes?.setHoverAt(instanceId as number, true);

    if (this.rolledOverIdx !== instanceId) {
      this.rolledOverIdx = instanceId;

      const entity = this.entities.find((e) => e.instanceIdx === instanceId);

      if (entity) {
        if (e instanceof MousePickerEvents && e.object instanceof InstancedMeshWithController) {
          const controller = e.object?.attributesController;

          if (controller instanceof InstancedIconAttributes && controller.uiConfig) {
            controller?.uiConfig.name &&
              entity.runInteractionsFor(controller.uiConfig.name, 'onRollover');
          }
        }

        entity.updateState({ color: this.demoParams.highlightColor });
        entity.updateOverlayState('label', { color: this.demoParams.highlightColor });

        entity.overlayContent['badge_below']?.forEach((_, idx) => {
          entity.updateOverlayState(`badge_below`, { color: this.demoParams.highlightColor }, idx);
        });
        entity.update();

        const oldBadgePositions = entity.uiLayerSlotMap.get('badge_below');
        const oldLabelPositions = entity.uiLayerSlotMap.get('label');
        const oldDescriptionPositions = entity.uiLayerSlotMap.get('description');

        if (oldBadgePositions) {
          entity.animateUiSlotsTo(
            'badge_below',
            oldBadgePositions.map((pos) => pos.map((_) => ({ ..._, y: _.y - 5 }))),
          );
        }

        if (oldLabelPositions) {
          entity.animateUiSlotsTo(
            'label',
            oldLabelPositions.map((pos) => pos.map((_) => ({ ..._, y: _.y - 5 }))),
          );
        }

        if (oldDescriptionPositions) {
          entity.animateUiSlotsTo(
            'description',
            oldDescriptionPositions.map((pos) => pos.map((_) => ({ ..._, y: _.y - 5 }))),
          );
        }
      }
    }
  }

  onZoom(e: MouseControlsEvent) {
    // re-map zoom levels from [0, 1]. 0 is most zoomed-out
    if (e.percent && e.percent !== this.zoomPercent) {
      this.zoomPercent = e.percent;

      const s = NumberUtils.remap(e.percent, 0, 1, 1, 1.4);

      this.entities.forEach((entity) => {
        entity.setZoom(s);
      });
    }
  }

  dispose() {
    window.removeEventListener('resize', this.resizeDelegate);
    this.threeJsView?.dispose();
    this.isDisposed = true;
    this.gui?.destroy();

    this.threeJsView?.mousePicker.removeEventListener(
      MousePickerEvents.MOUSE_UP,
      this.onMouseUp,
      this,
    );

    this.threeJsView?.mousePicker.removeEventListener(
      MousePickerEvents.MOUSE_DOWN,
      this.onMouseDown,
      this,
    );

    this.threeJsView?.mousePicker.removeEventListener(
      MousePickerEvents.ROLL_OUT,
      this.onRollOut,
      this,
    );

    this.threeJsView?.mousePicker.removeEventListener(
      MousePickerEvents.ROLL_OVER,
      this.onRollOver,
      this,
    );
  }
}
