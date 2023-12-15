/**
 * TODO once we move to animating in the shader,
 * every change that affects the instance matrix
 * should also update animation-related attribute arrays
 * so that animation can happen in the shader.
 *
 * TODO This class doesn't support setting the appropriate index
 * for the texture array which is sent to the GPU.
 * It assumes that the spritesheet given to it (at the moment SvgMeshGenerator)
 * only has one page.
 *
 * TODO Delete lookup maps on remove()
 */
import gsap, { Power3 } from "gsap";
import * as THREE from "three";

import { SvgMeshGenerator } from "../generators/SvgMeshGenerator";
import { RequestAnimationFrame } from "../graph-utils-v2/utils/request-animation-frame";
import { InstancedMultiUvMaterial } from "../materials/InstancedMultiUvMaterial";
import { InstancedAttributes } from "./instanced-attributes";

import type { ThreeJSView } from "../core/ThreeJSView";
import type { InstancedUvMaterial } from "../materials/InstancedUvMaterial";
import type { NormalizedBbox } from "../textures/sprite-sheets/SpriteRegion";
import type {
  EntityWithId,
  InstancedMeshWithController,
  UiBadgeConfiguration,
} from "./instanced-attributes";
import type { InstancedInteractionAttributes } from "./instanced-interaction-attributes";
import type { InstancedTextAttributes } from "./instanced-text-attributes";
import type { PlaneGeometry } from "three";

const BASE_ICON_SIZE = 24;
const PLANE_GEOMETRY_WIDTH = 1;
const PLANE_GEOMETRY_HEIGHT = 1;

export interface InstancedIconConfiguration {
  maxTextureArraySize?: number;
  textureAtlas?: HTMLCanvasElement | THREE.Texture;
}

export class InstancedIconAttributes extends InstancedAttributes<
  PlaneGeometry,
  InstancedUvMaterial
> {
  readonly color = new THREE.Color();
  readonly vector = new THREE.Vector3();
  readonly translation3 = new THREE.Vector3();
  readonly s = new THREE.Vector3();
  readonly matrix = new THREE.Matrix4();
  readonly bbox = new THREE.Box3();
  readonly q = new THREE.Quaternion(0, 0, 0, 0);
  uiConfig?: UiBadgeConfiguration;

  textureAtlas?: THREE.Texture;

  // Maximum texture array size we support sending to the shader
  static MAX_TEXTURE_ARRAY_SIZE = 1;

  // used for retaining base scale relative to geometry
  // this is counted in absolute units
  baseScaleLookup: Map<number, [number, number]> = new Map();

  zoomPercent = 1;

  isUiElement: boolean;

  // This is needed because otherwise TS complains when I try to
  // do this.mesh.geometry.parameters, saying that it doesn't exist
  // in type THREE.PlaneGeometry.
  declare mesh: InstancedMeshWithController<
    THREE.PlaneGeometry,
    InstancedMultiUvMaterial
  >;

  readonly uiLayers: Map<
    string,
    | InstancedIconAttributes
    | InstancedTextAttributes
    | InstancedInteractionAttributes
  > = new Map();

  uiLayersAreRegistered = false;

  constructor(
    iconConfig: InstancedIconConfiguration,
    uiConfig?: UiBadgeConfiguration
  ) {
    const instanceCount = 10000;

    const attributes = {
      // 1-step
      instanceOpacity: new THREE.InstancedBufferAttribute(
        new Float32Array(instanceCount).fill(1),
        1
      ),
      // 3-step [x, y, z]
      offset: new THREE.InstancedBufferAttribute(
        new Float32Array(instanceCount * 3).fill(0),
        3
      ),
      // 4-step [r, g, b, a]
      instanceColor: new THREE.InstancedBufferAttribute(
        new Float32Array(instanceCount * 4).fill(1),
        4
      ),
      // 1-step
      texIdx: new THREE.InstancedBufferAttribute(
        new Float32Array(instanceCount).fill(0),
        1
      ),
      // 4-step [x, y, width, height] - all normalized [0, 1]
      uvOffset: new THREE.InstancedBufferAttribute(
        new Float32Array(instanceCount * 4).fill(0),
        4
      ),
    };

    const geometry = new THREE.PlaneGeometry(
      PLANE_GEOMETRY_WIDTH,
      PLANE_GEOMETRY_HEIGHT
    );

    geometry.setAttribute("instanceColor", attributes.instanceColor);
    geometry.setAttribute("instanceOpacity", attributes.instanceOpacity);
    geometry.setAttribute("texIdx", attributes.texIdx);
    geometry.setAttribute("uvOffset", attributes.uvOffset);

    let texture: THREE.Texture | undefined = undefined;

    if (iconConfig?.textureAtlas) {
      if (iconConfig.textureAtlas instanceof HTMLCanvasElement) {
        const { textureAtlas } = iconConfig;

        texture = new THREE.CanvasTexture(
          textureAtlas,
          THREE.UVMapping,
          THREE.RepeatWrapping,
          THREE.RepeatWrapping
        );
      } else if (iconConfig.textureAtlas?.isTexture) {
        texture = iconConfig.textureAtlas;
      }
    } else {
      /**
       * This is dependent on SvgMeshGenerator having instantiated
       * the sprite sheet (ie. all the SVGs have been registered
       * inside SvgMeshGenerator)
       *
       * This happens inside icon-geometry-loader,
       * SvgMeshGenerator.freezeSpritesheet()
       */
      if (!SvgMeshGenerator?.spriteSheet?.firstBitmap?.canvas) {
        throw new Error("No bitmap available");
      }

      if (SvgMeshGenerator.spriteSheet.bitmaps.length > 1) {
        throw new Error(
          "SvgMeshGenerator.spriteSheet contains more than one bitmap – InstancedIconEntity currently uses InstancedUvMaterial which can only leverage one bitmap. This might be caused because we're trying to cache many more icons than can fit in a single bitmap"
        );
      }

      // TODO Specify which Canvas will be made into a texture
      // and provided to the map parameter.
      const textureAtlas = SvgMeshGenerator.spriteSheet?.firstBitmap
        ?.canvas as HTMLCanvasElement;

      texture = new THREE.CanvasTexture(
        textureAtlas,
        THREE.UVMapping,
        THREE.RepeatWrapping,
        THREE.RepeatWrapping
      );
    }

    const material = new InstancedMultiUvMaterial({
      map: texture,
      alphaTest: 0.1,
      transparent: true,
      defines: {
        USE_DEBUG_BOUNDS: false,
      },
    });

    material.texArray = [texture];
    material.numTextures = 1;
    material.needsUpdate = true;

    super({ geometry, material, attributes, count: instanceCount });

    this.textureAtlas = texture;

    // Update the instance matrix on every frame
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    if (iconConfig?.maxTextureArraySize) {
      InstancedIconAttributes.MAX_TEXTURE_ARRAY_SIZE =
        iconConfig?.maxTextureArraySize;
    }

    // This helps with the recursive structure we have
    // for handling instanced overlays.
    this.isUiElement = uiConfig !== undefined;
    this.uiConfig = uiConfig;

    if (this.uiConfig?.shouldDispatchMouseEvents) {
      this.shouldDispatchMouseEvents = this.uiConfig?.shouldDispatchMouseEvents;
    }

    this.pollAttributeTasks();
  }

  getUiLayer<
    T extends
      | InstancedIconAttributes
      | InstancedTextAttributes
      | InstancedInteractionAttributes =
      | InstancedIconAttributes
      | InstancedTextAttributes
      | InstancedInteractionAttributes
  >(name: string): T {
    const layer = this.uiLayers.get(name);

    if (!layer) {
      throw new Error(
        `instanced-icon-attributes: Requested UI layer doesn't exist: ${name}`
      );
    }

    return layer as T;
  }

  pollAttributeTasks() {
    this.raf = new RequestAnimationFrame(this.executeAttributeTasks, this);
    this.raf.start();
  }

  dispose() {
    super.dispose();

    for (let [, uiLayer] of this.uiLayers) {
      uiLayer.dispose();
    }
  }

  add(vertex: EntityWithId): number {
    const index = super.add(vertex);

    // NB It is important that all instance matrices are initialized
    // before any further rotation/translation/scale (TRS) is set
    this.mesh.getMatrixAt(index, this.matrix);
    this.matrix.makeTranslation(0, 0, 0);
    this.mesh.setMatrixAt(index, this.matrix);

    return index;
  }

  remove(vertex: EntityWithId): void {
    super.remove(vertex);

    for (let [, uiLayer] of this.uiLayers) {
      uiLayer.remove(vertex);
    }
  }

  // ICON-RELATED =============================================================

  changeIcon(
    idx: number,
    // the absolute width
    width: number,
    // the absolute height
    height: number,
    // the below numbers are normalized
    bbox: NormalizedBbox
  ) {
    const iconScaleX = width / PLANE_GEOMETRY_WIDTH;
    const iconScaleY = height / PLANE_GEOMETRY_HEIGHT;

    // retain information about the aspect ratio
    this.baseScaleLookup.set(idx, [iconScaleX, iconScaleY]);

    const [x, y, w, h] = bbox;

    // Math.min ensures that the icon doesn't get too relatively
    // wide or tall if it's wider by definition
    let minDimension = Math.min(iconScaleX, iconScaleY);

    this.setScale(idx, (this.uiConfig?.scale ?? 1) * minDimension, false);
    this.mesh.geometry.attributes.uvOffset.setXYZW(idx, x, y, w, h);
    this.mesh.geometry.attributes.uvOffset.needsUpdate = true;
  }

  private uvOffsetsFromSvgMeshGenerator(icon: string): NormalizedBbox {
    const { region } = SvgMeshGenerator.getIconMetadata(icon);

    if (!region) return [0, 0, 1, 1];

    const [x, y, w, h] = region.normalizedCoordinates;

    return [x, y, w, h];
  }

  /**
   * This function is responsible for rendering the primary icon
   * but also any kind of secondary icon (such as badges)
   * Secondary icons may be optional, so we need to have a check to see whether
   * they exist in the vertex configuration. If they don't exist,
   * we toggle the visibility of that particular instance so that it doesn't
   * render.
   */
  changeIconFromSvgMeshGenerator(idx: number, iconName: string | undefined) {
    if (iconName !== undefined) {
      this.toggleVisibility(idx, true);

      const [x, y, w, h] = this.uvOffsetsFromSvgMeshGenerator(iconName);

      const { height, width } = SvgMeshGenerator.getIconMetrics(iconName);

      this.changeIcon(idx, width, height, [x, y, w, h]);
    } else {
      this.toggleVisibility(idx, false);
    }
  }

  getIconSize(idx: number) {
    return this.baseScaleLookup.get(idx) ?? [1, 1];
  }

  setIconColor(idx: number, hexColor: number) {
    const [r, g, b] = this.color.setHex(hexColor).toArray();

    this.addAttributeTask(() => {
      this.mesh.geometry.attributes.instanceColor.setXYZ(idx, r, g, b);
    });
  }
  // END ICON-RELATED =========================================================

  getPosition(idx: number) {
    this.mesh.getMatrixAt(idx, this.matrix);
    this.matrix.decompose(this.translation3, this.q, this.s);

    return [
      this.translation3.x,
      this.translation3.y,
      this.translation3.z,
    ] as const;
  }

  // this is either called from the InstancedPositionVector3 proxy
  // or setScale (for the uiLayers)
  setPosition(idx: number, x: number, y: number, z: number, recurse = true) {
    this.vector.set(
      x + (this.uiConfig ? this.uiConfig.offset.x * this.zoomPercent : 0),
      y + (this.uiConfig ? this.uiConfig.offset.y * this.zoomPercent : 0),
      z
    );

    this.mesh.getMatrixAt(idx, this.matrix);
    this.matrix.decompose(this.translation3, this.q, this.s);

    this.matrix.compose(this.vector, this.q, this.s);
    this.mesh.setMatrixAt(idx, this.matrix);

    if (!this.isUiElement && recurse) {
      // update position for all the children
      for (let [, uiLayer] of this.uiLayers) {
        if (uiLayer?.uiConfig?.offset) {
          uiLayer.setPosition(idx, x, y, z);
        }
      }
    }
  }

  /**
   * This function is only called by the root, which recursively propagates
   * the (relative) scales down to the children.
   *
   * NB: It was the source of a horrible bug, when the scale parameter was passed as a
   * Vector3 (this.vector.set), and was recursively mutated in setPosition
   * when setScale called setPosition.
   *
   * That's why it's always good to pass primitives in recursive functions!
   */
  setScale(idx: number, scalar: number, recurse = true) {
    const [baseScaleX, baseScaleY] = this.getIconSize(idx);

    this.mesh.getMatrixAt(idx, this.matrix);
    this.matrix.decompose(this.translation3, this.q, this.s);

    this.s.set(
      (baseScaleX / baseScaleY) * scalar * this.zoomPercent,
      scalar * this.zoomPercent,
      1
    );
    this.matrix.compose(this.translation3, this.q, this.s);
    this.mesh.setMatrixAt(idx, this.matrix);

    if (!this.isUiElement && recurse) {
      // update scale and position for all the children
      for (let [, uiLayer] of this.uiLayers) {
        if (uiLayer?.uiConfig?.scale) {
          uiLayer.setScale(idx, scalar * uiLayer.uiConfig.scale);

          // if we don't update positions as well, then any uiLayer-configured
          // offset won't be zoom-specific.
          uiLayer.setPosition(
            idx,
            this.translation3.x,
            this.translation3.y,
            this.translation3.z
          );
        }
      }
    }
  }

  setRotation(idx: number, q: THREE.Quaternion) {
    this.mesh.getMatrixAt(idx, this.matrix);
    this.matrix.decompose(this.translation3, this.q, this.s);
    this.matrix.compose(this.translation3, q, this.s);
    this.mesh.setMatrixAt(idx, this.matrix);

    // TODO Make recursive
  }

  setZoomAt(idx: number, scalar: number) {
    this.mesh.getMatrixAt(idx, this.matrix);

    this.zoomPercent = scalar;

    if (!this.isUiElement) {
      for (let [, uiLayer] of this.uiLayers) {
        uiLayer.zoomPercent = scalar;
      }
    }

    this.setScale(idx, BASE_ICON_SIZE / PLANE_GEOMETRY_WIDTH, true);
  }

  animatePosition(
    idx: number,
    x: number,
    y: number,
    duration = 1,
    recurse = true
  ) {
    const [originX, originY, originZ] = this.getPosition(idx);

    // TODO Kill existing animations
    gsap.fromTo(
      { x: originX, y: originY, z: originZ },
      {
        x: originX,
        y: originY,
        z: originZ,
      },
      {
        x,
        y,
        z: originZ,
        ease: Power3.easeInOut,
        duration,
        onUpdate(context) {
          const x = +gsap.getProperty(this.targets()[0], "x");
          const y = +gsap.getProperty(this.targets()[0], "y");
          const z = +gsap.getProperty(this.targets()[0], "z");

          context.setPosition(idx, x, y, z, recurse);
        },
        onUpdateParams: [this],
      }
    );
  }

  toggleVisibility(idx: number, isVisible: boolean, recurse = true) {
    // Perf: Should there be additional checks to make sure this isn't needlessly set?
    // A check for:
    // this.mesh.geometry.attributes.instanceOpacity.getX(idx) !== Number(isVisible)
    // previously present but there seemed to be some asynchronous issues,
    // where the uiOverlay icon didn't appear on initial load.
    this.addAttributeTask(() => {
      this.mesh.geometry.attributes.instanceOpacity.setX(
        idx,
        Number(isVisible)
      );
    });

    if (!this.isUiElement && recurse) {
      // update position for all the children
      for (let [, uiLayer] of this.uiLayers) {
        uiLayer.toggleVisibility(idx, isVisible);
      }
    }
  }

  getVisibilityAt(idx: number) {
    const isTransparent = Boolean(
      this.mesh.geometry.attributes.instanceOpacity.getX(idx) ?? 1
    );

    const isDiscarded = Boolean(
      this.mesh.geometry.attributes.instanceDisplay.getX(idx)
    );

    return isTransparent && isDiscarded;
  }

  updateConfig(config: UiBadgeConfiguration) {
    if (!this.isUiElement) return;

    this.uiConfig = config;
  }

  // TODO Each attribute task should be keyed, so that we know
  // to only update the necessary attribute array, instead of blindly
  // telling the GPU to update all of them, as we are doing now
  executeAttributeTasks() {
    if (!this.mesh) return;
    super.executeAttributeTasks();

    this.mesh.geometry.attributes.instanceOpacity.needsUpdate = true;
    this.mesh.geometry.attributes.uvOffset.needsUpdate = true;
    this.mesh.geometry.attributes.instanceColor.needsUpdate = true;

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  addMeshToScene(scene: THREE.Scene | ThreeJSView | THREE.Object3D) {
    // this adds the 'main' mesh
    super.addMeshToScene(scene);

    for (let [, uiLayer] of this.uiLayers) {
      uiLayer.addMeshToScene(scene);
    }
  }

  // Translates along with all children
  translate(x: number, y: number) {
    this.mesh.position.x = x;
    this.mesh.position.y = y;

    if (!this.isUiElement) {
      for (let [, uiLayer] of this.uiLayers) {
        uiLayer.mesh.position.x = x;
        uiLayer.mesh.position.y = y;
      }
    }
  }

  get dimensions(): THREE.Box3 {
    // super.setDisplayAt batches calls.
    // If this method gets called before the instanceDisplay attribute array is set,
    // it will give us the incorrect results.
    // To prevent this, we need to execute frame-loop-tasks earlier.
    this.executeAttributeTasks();

    this.bbox.makeEmpty();

    // Anything that extends InstancedAttributes includes the ability
    // to display a geometry or not at the shader level.
    const attributeAffectsDisplay =
      !!this.mesh.geometry.attributes.instanceDisplay;

    for (let idx = 0; idx < this.size; idx++) {
      // Is it hidden?
      if (
        attributeAffectsDisplay &&
        this.mesh.geometry.attributes.instanceDisplay.getX(idx) === 0
      ) {
        continue;
      }

      // Extracting a single position
      // from a THREE.InstancedMesh https://jsfiddle.net/ew1tyz63/2/
      this.mesh.getMatrixAt(idx, this.matrix);
      this.vector.setFromMatrixPosition(this.matrix);
      this.bbox.expandByPoint(this.vector);
    }

    return this.bbox;
  }

  get name() {
    return `instanced-icon-attributes-${this.mesh.uuid.slice(0, 7)}`;
  }

  /**
   * This method returns the names (1-level deep) of all the UI layers (when called from the root).
   * It is used to disambiguate the name of an instanced attribute class from the MousePicker,
   * to its parent element (ie. to know to differentiate if the interactive instance is from an
   * InstancedIconEntity or a ConfigurableIconEntity etc...)
   */
  get allLayerNames() {
    if (this.isUiElement) return;

    return [
      this.name,
      ...[...(this.uiLayers.values() ?? [])].map((a) => a.name),
    ];
  }
}
