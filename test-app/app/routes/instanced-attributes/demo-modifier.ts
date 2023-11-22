/**
 * TODO Increasing pixelDensity misaligns the label textures.
 * TODO LabelGenerator has a problem where,
 * if there aren't enough characters,
 * "Vertex buffer is not big enough for the draw call"
 * TODO Are there too many LabelMesh objects created?
 *
 * This demo generates N strings and renders them to offscreen textures.
 * It is meant to demonstrate the capabilities of the InstancedMultiUvMaterial
 * and shader, which will sample an appropriate from an array of textures.
 */
import { registerDestructor } from '@ember/destroyable';

import { MousePickerEvents, setupScene, TextGenerator, TextStyle } from '@crowdstrike/graphics-core';
import * as dat from 'dat.gui';
import Modifier from 'ember-modifier';
import iconCoordinates from 'test-app-for-graphics-core/utils/coordinates';
import {
  generateIconGridWithOverlays,
  generateTextGrid,
} from 'test-app-for-graphics-core/utils/entities';

import type {
  DynamicSpriteSheetGenerator,
  Event ,
  InstancedIconAttributes,
  InstancedInteractionAttributes,
  InstancedTextAttributes,
  ThreeJSView,
} from '@crowdstrike/graphics-core';
import type ApplicationInstance from '@ember/application/instance';
import type { IconCoordinates } from 'test-app-for-graphics-core/utils/coordinates';
import type * as THREE from 'three';

function oneOf<T>(a: Array<T>) {
  return a[Math.floor(Math.random() * a.length)];
}

interface Args {
  named: never;
  positional: never;
}

export class LabelGeneratorModifier extends Modifier<Args> {
  textEntities?: InstancedTextAttributes;
  iconEntities?: InstancedIconAttributes;
  interactionEntities?: InstancedInteractionAttributes;

  raf?: number;

  threeJsView?: ThreeJSView;
  renderer?: THREE.WebGLRenderer;
  textSpriteSheetGenerator: DynamicSpriteSheetGenerator;
  textGenerator: TextGenerator;

  gui: dat.GUI;

  demoParams = {
    animatePosition: false,
    bgColor: 0xeb855a,
  };

  constructor(owner: ApplicationInstance, args: Args) {
    super(owner, args);

    this.gui = new dat.GUI();

    this.textGenerator = new TextGenerator(2048, 2048);
    this.textSpriteSheetGenerator = TextGenerator.getSpriteSheetGenerator();

    registerDestructor(this, () => this.cleanup());
  }

  async modify(element: HTMLElement) {
    const { stats, renderer, controls, threeJsView } = setupScene(element);

    this.gui.add(this.demoParams, 'animatePosition');
    this.gui.addColor(this.demoParams, 'bgColor').onChange((v) => {
      renderer.setClearColor(v);
    });

    this.threeJsView = threeJsView;

    controls.maxDistance = 40000;
    controls.minDistance = 500;

    this.renderer = renderer;

    let style = new TextStyle();

    style.name = 'style-name';
    style.fontSize = 12;
    style.pixelDensity = 2;
    style.alignment = TextStyle.ALIGN_CENTER;
    style.fontName = 'Helvetica Neue';

    const iconCoordinateArray = Object.entries(iconCoordinates).flatMap(([key, val]) => ({
      key,
      ...val,
    }));

    const ICONS_TO_RENDER = iconCoordinateArray.length;

    const {
      baseIconAttributes: iconEntities,
      labelsAttributes,
      badgesAttributes,
      descriptionsAttributes,
      interactionsAttributes: interactionEntities,
    } = await generateIconGridWithOverlays();

    this.iconEntities = iconEntities;

    const { instancedTextAttributes: textEntities, labelMap } = generateTextGrid();

    this.interactionEntities = interactionEntities;

    this.textEntities = textEntities;

    // interactionEntities.addMeshToScene(threeJsView.container);
    // textEntities.addMeshToScene(threeJsView.container);
    iconEntities.addMeshToScene(threeJsView.container);

    // const mouseControls = new MouseControls({
    //   initialScale: 0.65,
    //   maxScale: 2.0,
    //   minScale: 0.2,
    //   object3DContainer: threeJsView.container,
    //   shouldDoubleRender: true,
    //   threeView: threeJsView,
    // });

    // mouseControls.throwDampingFactor = 0.1;
    // mouseControls.throwThreshold = 2;
    // mouseControls.addEventListener(
    //   MouseControlsEvent.ZOOM_COMPLETE,
    //   (e) => {
    //     console.log(e);
    //   },
    //   this,
    // );

    // Event listeners
    // document.addEventListener('mousemove', onMouseMove);
    controls.addEventListener('change', () => {
      for (let idx = 0; idx < iconEntities.size; idx++) {
        // TODO Get zoom level from view and do something
      }
    });

    renderer.setClearColor(this.demoParams.bgColor);

    let randomScale = 1;

    let textColors = [0x65eb8d, 0x2c709e, 0x4c9e64, 0x4daceb];
    let textColorIdx = 0;
    let currentTextColor = textColors[textColorIdx] as number;

    const periodicity = 1200;
    const badgeChangePeriodicity = 120;

    threeJsView.mousePicker.addEventListener(MousePickerEvents.MOUSE_UP, this.onMouseUp, this);
    threeJsView.mousePicker.addEventListener(MousePickerEvents.MOUSE_DOWN, this.onMouseDown, this);
    threeJsView.mousePicker.addEventListener(MousePickerEvents.ROLL_OUT, this.onRollOut, this);
    threeJsView.mousePicker.addEventListener(MousePickerEvents.ROLL_OVER, this.onRollOver, this);

    const animate = () => {
      this.raf = requestAnimationFrame(animate);
      controls.update();
      stats.update();

      const frameMod = renderer.info.render.frame % periodicity;
      const badgeFrameMod = renderer.info.render.frame % badgeChangePeriodicity;

      if (frameMod === 0) {
        // randomScale = 1;
        textColorIdx = ++textColorIdx % textColors.length;
        currentTextColor = textColors[textColorIdx] as number;
      }

      randomScale = 12 + Math.sin(2 * Math.PI * (frameMod / periodicity)) * 2;

      for (let idx = 0; idx < labelMap.size; idx++) {
        if (Math.random() < 0.002) {
          textEntities.setIconColor(idx, currentTextColor);
          iconEntities.setIconColor(idx, currentTextColor);
        }

        textEntities.setScale(idx, randomScale);
      }

      for (let idx = 0; idx < ICONS_TO_RENDER; idx++) {
        labelsAttributes.setScale(idx, randomScale);
        descriptionsAttributes.setScale(idx, randomScale - 2);

        if (badgeFrameMod === 0 && Math.random() < 0.4) {
          const { x, y, w, h, width, height, key } = oneOf(
            iconCoordinateArray
          ) as IconCoordinates & { key: string };

          badgesAttributes.changeIcon(idx, width, height, [x, y, w, h]);
          badgesAttributes.setIconColor(idx, currentTextColor);
          iconEntities.setIconColor(idx, currentTextColor);
          descriptionsAttributes.setIconColor(idx, currentTextColor);
          labelsAttributes.setIconColor(idx, currentTextColor);
          descriptionsAttributes.updateTextAt(idx, key);

          if (this.demoParams.animatePosition) {
            const [originX, originY] = iconEntities.getPosition(idx);

            if (Math.random() > 0.5) {
              iconEntities.animatePosition(idx, originX + 10, originY, 1);
            } else {
              iconEntities.animatePosition(idx, originX, originY - 10, 1);
            }
          }
        }
      }

      threeJsView.render();
      // mouseControls.render();
    };

    animate();
  }

  onMouseUp(e: MousePickerEvents | Event) {
    const { instanceId } = e as MousePickerEvents;

    if (instanceId === undefined) return;

    this.interactionEntities?.setDisplayAt(instanceId as number, true);
    this.interactionEntities?.setHoverAt(instanceId as number, true);
    this.interactionEntities?.setSelectAt(instanceId as number, true);
  }

  onMouseDown(e: MousePickerEvents | Event) {
    const { instanceId } = e as MousePickerEvents;

    if (instanceId === undefined) return;

    // this.interactionEntities?.setDisplayAt(instanceId as number, true);
    // this.interactionEntities?.setHoverAt(instanceId as number, true);
    // this.interactionEntities?.setSelectAt(instanceId as number, true);
  }

  onRollOut(e: MousePickerEvents | Event) {
    const { instanceId } = e as MousePickerEvents;

    if (instanceId === undefined) return;

    this.interactionEntities?.setDisplayAt(instanceId as number, false);
    this.interactionEntities?.setHoverAt(instanceId as number, false);
    this.interactionEntities?.setSelectAt(instanceId as number, false);
  }

  onRollOver(e: MousePickerEvents | Event) {
    const { instanceId } = e as MousePickerEvents;

    if (instanceId === undefined) return;

    this.interactionEntities?.setDisplayAt(instanceId as number, true);
    this.interactionEntities?.setHoverAt(instanceId as number, true);
    this.interactionEntities?.setSelectAt(instanceId as number, false);
  }

  cleanup() {
    this.renderer?.dispose();
    this.textEntities?.dispose();
    this.iconEntities?.dispose();
    this.raf && cancelAnimationFrame(this.raf);

    // gets rid of the static DynamicSpriteSheetGenerator
    this.textGenerator.dispose();

    this.threeJsView?.mousePicker.removeEventListener(
      MousePickerEvents.MOUSE_UP,
      this.onMouseUp,
      this
    );
    this.threeJsView?.mousePicker.removeEventListener(
      MousePickerEvents.MOUSE_DOWN,
      this.onMouseDown,
      this
    );
    this.threeJsView?.mousePicker.removeEventListener(
      MousePickerEvents.ROLL_OUT,
      this.onRollOut,
      this
    );
    this.threeJsView?.mousePicker.removeEventListener(
      MousePickerEvents.ROLL_OVER,
      this.onRollOver,
      this
    );

    // recreate the static DynamicSpriteSheetGenerator
    TextGenerator.getSpriteSheetGenerator().requestRegion(2048, 2048);
  }
}
