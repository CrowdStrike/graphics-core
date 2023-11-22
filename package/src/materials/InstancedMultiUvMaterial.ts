import * as THREE from 'three';

import {
  InstancedMultiUvFragmentShader,
  InstancedMultiUvVertexShader,
} from '../shaders/InstancedMultiUvMaterialShader';

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
export class InstancedMultiUvMaterial extends THREE.ShaderMaterial {
  _numTextures = 1;

  constructor(parameters: BasicTintShaderParameters = {}) {
    super({
      vertexShader: InstancedMultiUvVertexShader,
      fragmentShader: InstancedMultiUvFragmentShader(1),
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
          u_textures: {
            type: 't',
            value: [],
          },
        },
      ]),
      defines: {},
    });

    this.setValues(parameters);
  }

  set map(v: THREE.Texture) {
    this.uniforms.map.value = v;
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
    return this.uniforms.map.value;
  }

  set color(v) {
    this.uniforms.diffuse.value = v;
  }

  get color() {
    return this.uniforms.diffuse.value;
  }

  get texArray() {
    return this.uniforms.u_textures.value;
  }

  set texArray(v) {
    this.uniforms.u_textures.value = v;
    this.numTextures = v.length;
  }

  set numTextures(v: number) {
    this._numTextures = v;
    this.fragmentShader = InstancedMultiUvFragmentShader(v);
    this.needsUpdate = true;
  }

  get numTextures() {
    return this._numTextures;
  }

  set borderOffset(v) {
    this.uniforms.borderOffset.value = v;
  }

  get borderOffset() {
    return this.uniforms.borderOffset.value;
  }

  set borderColor(v) {
    this.uniforms.borderColor.value = v;
  }

  get borderColor() {
    return this.uniforms.borderColor.value;
  }

  set tint(v) {
    this.uniforms.tintColor.value = v;
  }

  get tint(): THREE.Color {
    return this.uniforms.tintColor.value;
  }
}
