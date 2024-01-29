import { gsap, Power3 } from 'gsap';
import * as THREE from 'three';

import { RequestAnimationFrame } from '../graph-utils-v2/utils/request-animation-frame';
import { InstancedCircleMaterial } from '../materials/InstancedCircleMaterial';
import { InstancedAttributes } from './instanced-attributes';

import type { ThreeJSView } from '../core/ThreeJSView';
import type { EntityWithId, InstancedMeshWithController, UiBadgeConfiguration } from './instanced-attributes';

const PLANE_GEOMETRY_WIDTH = 1;

export interface InstancedInteractionIconConfiguration {
  size: number;
}

export class InstancedInteractionAttributes extends InstancedAttributes<THREE.PlaneGeometry, InstancedCircleMaterial> {
  readonly color = new THREE.Color();
  readonly vector = new THREE.Vector3();
  readonly translation3 = new THREE.Vector3();
  readonly s = new THREE.Vector3();
  readonly matrix = new THREE.Matrix4();
  readonly bbox = new THREE.Box3();
  readonly q = new THREE.Quaternion(0, 0, 0, 0);

  private selectedLookup: Map<number, number> = new Map();
  private tweenLookup: Map<number, gsap.core.Tween[]> = new Map();
  private hoveredLookup: Map<number, number> = new Map();

  private interactionPlaneSize = 24;

  zoomPercent = 1;

  isUiElement = false;
  uiConfig?: UiBadgeConfiguration;

  declare mesh: InstancedMeshWithController<THREE.PlaneGeometry, InstancedCircleMaterial>;

  // uiConfig is only necessary if this class is to be used as a badge
  constructor(config: InstancedInteractionIconConfiguration, uiConfig?: UiBadgeConfiguration) {
    const instanceCount = 10000;

    const attributes = {
      // 1-step
      instanceOpacity: new THREE.InstancedBufferAttribute(new Float32Array(instanceCount).fill(1), 1),
      // 3-step [x, y, z]
      color: new THREE.InstancedBufferAttribute(new Float32Array(instanceCount * 3).fill(1), 3),
      // 3-step [x, y, z]
      ringColor: new THREE.InstancedBufferAttribute(new Float32Array(instanceCount * 3).fill(1), 3),
      // 1-step
      isHovered: new THREE.InstancedBufferAttribute(new Float32Array(instanceCount).fill(0), 1),
      // 1-step
      isSelected: new THREE.InstancedBufferAttribute(new Float32Array(instanceCount).fill(0), 1),
    };

    const geometry = new THREE.PlaneGeometry(1, 1);

    geometry.setAttribute('instanceOpacity', attributes.instanceOpacity);
    geometry.setAttribute('color', attributes.color);
    geometry.setAttribute('ringColor', attributes.ringColor);
    geometry.setAttribute('isHovered', attributes.isHovered);
    geometry.setAttribute('isSelected', attributes.isSelected);

    const material = new InstancedCircleMaterial();

    material.transparent = true;
    material.ringWidth = 0.04;

    super({ geometry, material, count: instanceCount, attributes });

    this.interactionPlaneSize = config.size;

    // enables mouse picking
    this.shouldDispatchMouseEvents = true;

    // This helps with the recursive structure we have
    // for handling instanced overlays.
    this.isUiElement = uiConfig !== undefined;
    this.uiConfig = uiConfig;

    this.pollAttributeTasks();
  }

  add(vertex: EntityWithId) {
    const instanceIdx = super.add(vertex);

    this.hoveredLookup.set(instanceIdx, 0);
    this.selectedLookup.set(instanceIdx, 0);
    this.tweenLookup.set(instanceIdx, []);

    return instanceIdx;
  }

  pollAttributeTasks() {
    this.raf = new RequestAnimationFrame(this.executeAttributeTasks, this);
    this.raf.start();
  }

  setScale(idx: number, scalar: number) {
    this.mesh.getMatrixAt(idx, this.matrix);
    this.matrix.decompose(this.translation3, this.q, this.s);

    this.s.set(scalar * this.zoomPercent, scalar * this.zoomPercent, 1);
    this.matrix.compose(this.translation3, this.q, this.s);
    this.mesh.setMatrixAt(idx, this.matrix);
  }

  // this is either called from the InstancedPositionVector3 proxy
  // or setScale (for the uiLayers)
  setPosition(idx: number, x: number, y: number, z: number) {
    this.vector.set(x, y, z);
    this.mesh.getMatrixAt(idx, this.matrix);
    this.matrix.decompose(this.translation3, this.q, this.s);

    this.matrix.compose(this.vector, this.q, this.s);
    this.mesh.setMatrixAt(idx, this.matrix);
  }

  setZoomAt(idx: number, scalar: number) {
    this.mesh.getMatrixAt(idx, this.matrix);

    this.zoomPercent = scalar;

    this.setScale(idx, this.interactionPlaneSize / PLANE_GEOMETRY_WIDTH);
  }

  toggleVisibility(idx: number, isVisible: boolean) {
    // Perf: Should there be additional checks to make sure this isn't needlessly set?
    // A check for:
    // this.mesh.geometry.attributes.instanceOpacity.getX(idx) !== Number(isVisible)
    // previously present but there seemed to be some asynchronous issues,
    // where the uiOverlay icon didn't appear on initial load.
    this.addAttributeTask(() => {
      this.mesh.geometry.attributes.instanceOpacity.setX(idx, Number(isVisible));
    });
  }

  getVisibilityAt(idx: number) {
    const isTransparent = Boolean(this.mesh.geometry.attributes.instanceOpacity.getX(idx) ?? 1);

    const isDiscarded = Boolean(this.mesh.geometry.attributes.instanceDisplay.getX(idx));

    return isTransparent && isDiscarded;
  }

  getHoveredAt(idx: number) {
    return Boolean(this.hoveredLookup.get(idx));
  }

  getSelectedAt(idx: number) {
    return Boolean(this.selectedLookup.get(idx));
  }

  executeAttributeTasks() {
    if (!this.mesh) return;
    super.executeAttributeTasks();

    this.mesh.geometry.attributes.color.needsUpdate = true;
    this.mesh.geometry.attributes.ringColor.needsUpdate = true;
    this.mesh.geometry.attributes.isHovered.needsUpdate = true;
    this.mesh.geometry.attributes.isSelected.needsUpdate = true;

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  addMeshToScene(scene: THREE.Scene | ThreeJSView | THREE.Object3D) {
    super.addMeshToScene(scene);

    // Interaction plane needs to be pushed slightly back, compared to other elements
    this.mesh.position.z = this.mesh.position.z - 0.1;
  }

  setColorAt(idx: number, hexColor: number) {
    const [r, g, b] = this.color.setHex(hexColor).toArray();

    this.addAttributeTask(() => {
      this.mesh.geometry.attributes.color?.setXYZ(idx, r, g, b);
    });
  }

  setRingColorAt(idx: number, hexColor: number) {
    const [r, g, b] = this.color.setHex(hexColor).toArray();

    this.addAttributeTask(() => {
      this.mesh.geometry.attributes.ringColor?.setXYZ(idx, r, g, b);
    });
  }

  setSelectAt(idx: number, isSelected: boolean) {
    const oldSelected = this.selectedLookup.get(idx);

    this.selectedLookup.set(idx, Number(isSelected));

    this.tweenLookup.get(idx)?.push(
      gsap.fromTo(
        { x: 0, opacity: 0 },
        { x: Number(oldSelected) },
        {
          x: Number(isSelected),
          ease: Power3.easeInOut,
          duration: 0.4,
          onUpdate(context) {
            context.addAttributeTask(() => {
              context.mesh.geometry.attributes.isSelected.setX(idx, +gsap.getProperty(this.targets()[0], 'x'));
            });
          },
          onUpdateParams: [this],
        },
      ),
    );
  }

  setHoverAt(idx: number, isHovered: boolean) {
    const oldHovered = this.hoveredLookup.get(idx);

    this.hoveredLookup.set(idx, Number(isHovered));
    this.mesh.userData[idx] = {
      ...this.mesh.userData[idx],
      isHovered,
    };

    this.tweenLookup.get(idx)?.push(
      gsap.fromTo(
        { x: 0, opacity: 0 },
        { x: Number(oldHovered), opacity: Number(oldHovered) },
        {
          x: Number(isHovered),
          opacity: Number(isHovered),
          ease: Power3.easeInOut,
          duration: 0.4,
          onUpdate(context) {
            context.addAttributeTask(() => {
              context.mesh.geometry.attributes.isHovered.setX(idx, +gsap.getProperty(this.targets()[0], 'x'));
            });
          },
          onUpdateParams: [this],
        },
      ),
    );
  }

  get name() {
    return `instanced-interaction-attributes-${this.mesh.uuid.slice(0, 7)}`;
  }
}
