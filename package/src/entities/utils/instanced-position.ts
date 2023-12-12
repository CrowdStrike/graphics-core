import gsap, { Power3 } from 'gsap';
import * as THREE from 'three';

import type { GraphicsV2VertexController } from '../../graph/entities/vertex';
import type { InstancedAttributes } from '../instanced-attributes';

interface InstancedPositionVector3Props {
  x: number;
  y: number;
  z: number;
  id: string;
  attributes: InstancedAttributes;
  entity?: GraphicsV2VertexController;
}

const positionHandler = {
  set(target: InstancedPositionVector3, prop: string, value: number) {
    switch (prop) {
      case 'x':
        target.set(value, target.y, target.z);

        break;
      case 'y':
        target.set(target.x, value, target.z);

        break;
      case 'z':
        target.set(target.x, target.y, value);

        break;
      default:
        break;
    }

    return true;
  },
};

export class InstancedPositionVector3 extends THREE.Vector3 {
  declare _id: string;

  attributes: InstancedAttributes;
  entity?: GraphicsV2VertexController;

  constructor({ x, y, z, id, attributes, entity }: InstancedPositionVector3Props) {
    super(x, y, z);
    this.entity = entity;
    this.attributes = attributes;
    this.id = id;

    return new Proxy(this, positionHandler);
  }

  get id() {
    return this._id;
  }

  set id(v) {
    this._id = v;
  }

  /**
   * Repeatedly calls setPosition at the given index, which
   * retrieves and modifies the translation matrix of the instance.
   *
   * TODO this should instead pass the necessary uniforms and attributes
   * so that the position animation happens inside the shader
   */
  animateTo(x: number, y: number, z: number, duration = 1) {
    gsap.fromTo(
      { x: this.x, y: this.y, z: this.z },
      { x: this.x, y: this.y, z: this.z },
      {
        x,
        y,
        z,
        ease: Power3.easeInOut,
        duration,
        onUpdate(instancedPositionContext) {
          const x = +gsap.getProperty(this.targets()[0], 'x') || 0;
          const y = +gsap.getProperty(this.targets()[0], 'y') || 0;
          const z = +gsap.getProperty(this.targets()[0], 'z') || 0;

          instancedPositionContext.set(x, y, z);
        },
        onUpdateParams: [this],
      },
    );
  }

  set(x: number, y: number, z: number) {
    if (x === this.x && y === this.y && z === this.z) return this;

    super.set(x, y, z);

    if (this.entity) {
      /**
       * This is necessary because:
       *
       * If we have an attached GraphicsV2VertexController entity,
       * the offsets in shared InstancedIconAttributes need to be reconfigured
       * for the particular "slot" location of each particular entity.
       *
       * This is useful if, for example, we're iterating over entities and setting
       * their positions using entity.position.set(). In this case, the InstancedIconAttributes
       * of each entity would not take into account the slot config of the particular entity
       * because the update() method wasn't called, which in turn calls the setConfigForLayers()
       * method.
       */
      this.entity.update();
    }

    const geometryIdx = this.attributes.idDict.get(this.id);

    if (geometryIdx === undefined) {
      // the object is not in the instanced attributes
      return this;
    }

    // TODO is there a way we can remove this.attributes from here?
    this.attributes.setPosition(geometryIdx, this.x, this.y, this.z);

    return this;
  }
}
