import gsap, { Power3 } from 'gsap';
import * as THREE from 'three';

import type { InstancedAttributes } from '../instanced-attributes';

interface InstancedPositionVector3Props {
  x: number;
  y: number;
  z: number;
  id: string;
  attributes: InstancedAttributes;
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

  constructor({ x, y, z, id, attributes }: InstancedPositionVector3Props) {
    super(x, y, z);
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
    super.set(x, y, z);

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
