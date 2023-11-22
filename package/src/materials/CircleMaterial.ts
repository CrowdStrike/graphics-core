import * as THREE from 'three';

import { CircleFragmentShader, CircleVertexShader } from '../shaders/CircleMaterialShader';

export class CircleMaterial extends THREE.ShaderMaterial {
  constructor(parameters = {}) {
    super({
      vertexShader: CircleVertexShader,
      fragmentShader: CircleFragmentShader,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.common,
        {
          color: {
            type: 'c',
            value: new THREE.Color(0xff0000),
          },
          ringColor: {
            type: 'c',
            value: new THREE.Color(0x00ffff),
          },
          ringWidth: {
            type: 'f',
            value: 0.04,
          },
          isHovered: {
            type: 'f',
            value: 0,
          },
          isSelected: {
            type: 'f',
            value: 0,
          },
        },
      ]),
      defines: {},
    });

    this.setValues(parameters);
  }

  set color(v) {
    if (this.uniforms.color) {
      this.uniforms.color.value = v;
    }
  }

  get color() {
    if (!this.uniforms.color) {
      throw new Error("CircleMaterial doesn't contain color uniform");
    }

    return this.uniforms.color.value;
  }

  set ringColor(v) {
    if (this.uniforms.ringColor) {
      this.uniforms.ringColor.value = v;
    }
  }

  get ringColor() {
    if (!this.uniforms.ringColor) {
      throw new Error("CircleMaterial doesn't contain ringColor uniform");
    }

    return this.uniforms.ringColor.value;
  }

  set ringWidth(v) {
    if (this.uniforms.ringWidth) {
      this.uniforms.ringWidth.value = v;
    }
  }

  get ringWidth() {
    if (!this.uniforms.ringWidth) {
      throw new Error("CircleMaterial doesn't contain ringWidth uniform");
    }

    return this.uniforms.ringWidth.value;
  }

  set isHovered(v) {
    if (this.uniforms.isHovered) {
      this.uniforms.isHovered.value = v;
    }
  }

  get isHovered() {
    if (!this.uniforms.isHovered) {
      throw new Error("CircleMaterial doesn't contain isHovered uniform");
    }

    return this.uniforms.isHovered.value;
  }

  set isSelected(v) {
    if (this.uniforms.isSelected) {
      this.uniforms.isSelected.value = v;
    }
  }

  get isSelected() {
    if (!this.uniforms.isSelected) {
      throw new Error("CircleMaterial doesn't contian isSelected uniform");
    }

    return this.uniforms.isSelected.value;
  }
}
