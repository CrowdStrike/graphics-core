import * as THREE from 'three';

import { InstancedCircleFragmentShader, InstancedCircleVertexShader } from '../shaders/InstancedCircleMaterialShader';

export class InstancedCircleMaterial extends THREE.ShaderMaterial {
  constructor(parameters = {}) {
    super({
      vertexShader: InstancedCircleVertexShader,
      fragmentShader: InstancedCircleFragmentShader,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.common,
        {
          ringWidth: {
            type: 'f',
            value: 0.04,
          },
        },
      ]),
      defines: {},
    });

    this.setValues(parameters);
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
}
