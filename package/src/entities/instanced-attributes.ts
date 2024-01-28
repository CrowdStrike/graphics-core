/**
 * This base class is responsible for a set of common operations
 * on instanced meshes. At a low-level, it deals with keeping a
 * map of IDs and indices for each instance, so that we know which
 * index of the relevant attribute buffer we need to target if, for
 * example, we want to update the color for one instance.
 *
 * Because uploading these attribute buffers to the GPU is expensive,
 * we batch these updates and upload them maximum once per frame.
 *
 * TODO Composition of (instanced) presentational elements
 * should be "chained" inside a relevant data structure here.
 *
 * TODO Handle resizing of the InstancedMesh and attributes.
 * At the moment we enable a max instance count of 10000
 */
import * as THREE from 'three';

import { RequestAnimationFrame } from '../graph-utils-v2/utils/request-animation-frame';

import type { ThreeJSView } from '../core/ThreeJSView';

/**
 * UI layers are used for attaching other instanced elements
 * to existing ones, and keeping their scale/translation in sync
 * with the root.
 */
export interface UiBadgeConfiguration {
  name: string;
  offset: {
    x: number;
    y: number;
  };
  // how much to scale (relative to the parent)
  scale: number;
  // our MousePicker checks for this property to know whether
  // or not to dispatch mouse events
  shouldDispatchMouseEvents?: boolean;
}

export interface EntityWithId {
  id: string;
}

interface Task {
  (geometry: THREE.BufferGeometry, dictionary: Map<string, number>): void;
}

export class InstancedMeshWithController<
  Geometry extends THREE.BufferGeometry = THREE.BufferGeometry,
  Material extends THREE.Material = THREE.Material,
> extends THREE.InstancedMesh {
  isInstancedMeshWithController = true;
  attributesController: InstancedAttributes<Geometry, Material>;
  declare material: Material;

  constructor(
    geometry: Geometry,
    material: Material,
    instanceCount: number,
    controller: InstancedAttributes<Geometry, Material>,
  ) {
    super(geometry, material, instanceCount);

    this.attributesController = controller;
  }
}

export const UNKNOWN_INSTANCE_IDX = Symbol('Unknown Instance Index');

export class InstancedAttributes<
  Geometry extends THREE.BufferGeometry = THREE.BufferGeometry,
  Material extends THREE.Material = THREE.Material,
> {
  raf?: RequestAnimationFrame;

  /**
   * holds all the provided buffer attributes here, which are also
   * found in `this.mesh.geometry.attributes`
   */
  _attributes: Record<string, THREE.InstancedBufferAttribute> = {};

  // used for debouncing the upload of data to the GPU
  attributeTasks: Task[] = [];

  // keeps track of instance index keyed by each element's unique ID
  _idDict: Map<string, number> = new Map();

  // max number of instances that can be drawn
  maxInstanceCount: number;

  // mouse events are disabled by default
  protected _shouldDispatchMouseEvents = false;

  // keeps track of the next available index
  protected indexPool: number[];

  setPosition(idx: number, x: number, y: number, z: number) {
    idx;
    x;
    y;
    z;
  }

  readonly mesh: InstancedMeshWithController<Geometry, Material>;

  // all the scene ids in which the mesh has been added so far
  meshAddedToScenes: string[] = [];

  constructor({
    attributes,
    geometry,
    material,
    count,
  }: {
    geometry: Geometry;
    material: Material;
    count: number;
    attributes: Record<string, THREE.InstancedBufferAttribute>;
  }) {
    this.mesh = new InstancedMeshWithController<Geometry, Material>(geometry, material, count, this);
    // Update the instance matrix on every frame
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.name = this.name;
    this.mesh.frustumCulled = false;
    this.maxInstanceCount = this.mesh.count;
    this.attributes = attributes;

    // keep track of which instances we show and attach to mesh
    this.mesh.geometry.setAttribute(
      'instanceDisplay',
      new THREE.InstancedBufferAttribute(new Float32Array(this.maxInstanceCount).fill(0), 1),
    );

    this.indexPool = Array.from(Array(this.maxInstanceCount).keys());
  }

  // This is currently used only for unit testing
  pollAttributeTasks() {
    this.raf = new RequestAnimationFrame(this.executeAttributeTasks, this);
    this.raf.start();
  }

  // Adds the id to the index dictionary
  // and return the corresponding index
  add(vertex: EntityWithId): number {
    const { id } = vertex;

    // prevent the case where the ID already exists
    // this shouldn't be the case, but just as a
    // precautionary measure.
    let instanceIdx;

    if (this.idDict.has(id)) {
      instanceIdx = this.idDict.get(id);
    } else {
      instanceIdx = this.indexPool.shift();
    }

    if (instanceIdx === undefined) {
      throw new Error('reached limit count for instanced object');
    }

    this.idDict.set(id, instanceIdx);

    this.updateMeshInstanceCount();

    this.setDisplayAt(instanceIdx, true);

    return instanceIdx;
  }

  /**
   * Update how many instances are drawn on all
   * meshes the appear on screen
   *
   * Imagine we have the following elements with the following instance indices:
   * [0, 1, 2, 3, 4, 5]
   *
   * If elements at indices 2, 3 get removed (in that order), then we have [0, 1, 4, 5],
   * and our pool of next available indices becomes:
   * [3, 2, 6, 7, ...]
   *
   * So, the total of elements that need to be rendered
   * is max([0, 1, 4, 5]) = 5 + 1, for a total of 6 elements.
   * The ones at indices 2, 3 will get discarded in the fragment shader, until another visible instance claims them.
   */
  updateMeshInstanceCount() {
    if (this.mesh) {
      /**
       * the maximum value of this.mesh.count is [0, n], where
       * n is the number provided in `new InstancedMesh(geometry, material, n)`
       *
       * Because of `this.indexPool = Array.from(Array(this.mesh.count).keys());`
       * in the constructor, the largest element in `this.indexPool` will be n.
       */
      this.mesh.count = Math.max(...this.idDict.values()) + 1;
    }
  }

  remove(vertex: EntityWithId): void {
    const { id } = vertex;

    // where is this instance located?
    const instanceIdx = this.dataForId(id);

    if (instanceIdx === UNKNOWN_INSTANCE_IDX) {
      throw new Error("Can't remove instance index");
    }

    // tell the shader to discard this instance
    this.setDisplayAt(instanceIdx, false);

    // remove ID from dictionary
    this.idDict.delete(id);

    // make this index available
    this.indexPool.unshift(instanceIdx);
  }

  /**
   * The instanceDisplay attribute results in the geometry
   * getting discarded in the fragment shader.
   */
  setDisplayAt(idx: number, show: boolean) {
    // Because the attribute array gets updated asynchronously after requesting a frame,
    // our bounding box getter (if implemented in child classes) needs to manually
    // override the attribute tasks frame loop
    // (check .dimensions impolementation inside InstancedIconAttributes)
    this.addAttributeTask(() => {
      this.mesh.geometry.attributes.instanceDisplay.setX(idx, Number(show));
    });
  }

  /**
   * If an instanced object wants to also implement opacity,
   * it will need to override this method;
   *
   * For example, take a look at the implemenentation inside
   * instanced-icon-attributes.
   */
  getVisibilityAt(idx: number) {
    return Boolean(this.mesh.geometry.attributes.instanceDisplay.getX(idx));
  }

  dataForId(id: string) {
    return this.idDict.get(id) ?? UNKNOWN_INSTANCE_IDX;
  }

  dispose() {
    this.raf?.stop();

    if (this.mesh.geometry) {
      this.mesh.geometry.dispose();
    }

    if (this.mesh) {
      this.mesh.dispose();
    }
  }

  addMeshToScene(scene: THREE.Scene | ThreeJSView | THREE.Object3D) {
    if (typeof scene.uuid === 'string' && !this.meshAddedToScenes.includes(scene.uuid)) {
      scene.add(this.mesh);
      this.mesh.position.z = 100;
      this.meshAddedToScenes.push(scene.uuid);
    }
  }

  addAttributeTask(f: () => void) {
    this.attributeTasks.push(f);
  }

  executeAttributeTasks() {
    if (this.attributeTasks.length === 0) return;

    this.attributeTasks.forEach((f) => f(this.mesh.geometry, this.idDict));

    // reset the index and keep the same object in order to avoid thrashing
    this.attributeTasks.length = 0;

    this.mesh.geometry.attributes.instanceDisplay.needsUpdate = true;

    this.mesh.computeBoundingSphere();
  }

  get shouldDispatchMouseEvents() {
    return this._shouldDispatchMouseEvents;
  }

  set shouldDispatchMouseEvents(v: boolean) {
    this._shouldDispatchMouseEvents = v;
  }

  // Translates along with all children
  translate(x: number, y: number) {
    this.mesh.position.x = x;
    this.mesh.position.y = y;
  }

  get attributes() {
    return this._attributes;
  }

  set attributes(v) {
    this._attributes = v;
  }

  get idDict() {
    return this._idDict;
  }

  get size() {
    return this.idDict.size;
  }

  get name() {
    return `instanced-attributes-${this.mesh.uuid.slice(0, 7)}`;
  }
}
