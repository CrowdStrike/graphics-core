import * as THREE from 'three';

import { InstancedUvFragmentShader, InstancedUvVertexShader } from '../shaders/InstancedUvMaterialShader';

// eslint-disable-next-line import/namespace
interface BasicTintShaderParameters extends THREE.ShaderMaterialParameters {
  map?: THREE.Texture;
  color?: string;
}

/**
 * This material is to be used with a THREE.InstancedMesh.
 *
 * The required geometry attributes are:
 *  - uvOffset (4-step): normalized (0–1)
 *    x, y positions of icon along with width and height,
 *    so the shader knows how to sample the provided texture
 *  - instanceColor (3-step): RGB values
 *  - instanceOpacity (1-step): the alpha value
 */
export class InstancedUvMaterial extends THREE.ShaderMaterial {
  constructor(parameters: BasicTintShaderParameters = {}) {
    super({
      vertexShader: InstancedUvVertexShader,
      fragmentShader: InstancedUvFragmentShader,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.common,
        {
          borderOffset: {
            type: 'f',
            value: 0.2,
          },
          borderColor: {
            type: 'c',
            value: new THREE.Color(0xff0000),
          },
        },
      ]),
      defines: {},
    });

    this.setValues(parameters);
  }

  set map(v: THREE.Texture) {
    if (this.uniforms.map) {
      this.uniforms.map.value = v;
    }
  }

  /**
   * NB: If this getter is not defined, it
   * seems that UV-related #includes will not be compiled
   *
   * frustratingly, THREE.js seems to check for the existence of properties
   * and getters on the material as a way of checking which shader
   * fragments should be included
   */
  get map() {
    if (!this.uniforms.map) {
      throw new Error("InstancedUvMaterial doesn't contain a map uniform");
    }

    return this.uniforms.map.value;
  }

  set color(v) {
    if (this.uniforms.diffuse) {
      this.uniforms.diffuse.value = v;
    }
  }

  get color() {
    if (!this.uniforms.diffuse) {
      throw new Error("InstancedUvMaterial doesn't contain a diffuse uniform");
    }

    return this.uniforms.diffuse.value;
  }

  set borderOffset(v) {
    if (this.uniforms.borderOffset) {
      this.uniforms.borderOffset.value = v;
    }
  }

  get borderOffset() {
    if (!this.uniforms.borderOffset) {
      throw new Error("InstancedUvMaterial doesn't contain a borderOffset uniform");
    }

    return this.uniforms.borderOffset.value;
  }

  set borderColor(v) {
    if (this.uniforms.borderColor) {
      this.uniforms.borderColor.value = v;
    }
  }

  get borderColor() {
    if (!this.uniforms.borderColor) {
      throw new Error("InstancedUvMaterial doesn't contain a borderColor uniform");
    }

    return this.uniforms.borderColor.value;
  }

  set tint(v) {
    if (this.uniforms.tintColor) {
      this.uniforms.tintColor.value = v;
    }
  }

  get tint(): THREE.Color {
    if (!this.uniforms.tintColor) {
      throw new Error("InstancedUvMaterial doesn't contain a tintColor uniform");
    }

    return this.uniforms.tintColor.value;
  }
}
