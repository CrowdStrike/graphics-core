import * as THREE from 'three';

import { MeshBasicTintFragmentShader, MeshBasicTintVertexShader } from '../shaders/MeshBasicTintMaterialShader';

// eslint-disable-next-line import/namespace
interface BasicTintShaderParameters extends THREE.ShaderMaterialParameters {
  map?: THREE.Texture;
  color?: string;
}

export class MeshBasicTintMaterial extends THREE.ShaderMaterial {
  offset = new THREE.Vector2(0, 0);
  repeat = new THREE.Vector2(1, 1);
  center = new THREE.Vector2(0, 0);
  rotation = 0;
  uvTransformMatrix = new THREE.Matrix3();
  setOffsetRepeatFromMap = true;

  constructor(parameters: BasicTintShaderParameters = {}) {
    super({
      vertexShader: MeshBasicTintVertexShader,
      fragmentShader: MeshBasicTintFragmentShader,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.common,
        {
          discardValue: {
            type: 'f',
            value: 0.009,
          },
          isDiscardEnabled: {
            type: 'f',
            value: 0.0,
          },
          isLookingAtCamera: {
            type: 'f',
            value: 1.0,
          },
          tintColor: {
            type: 'c',
            value: new THREE.Color(0x000000),
          },
          tintFlag: {
            type: 'v2',
            value: new THREE.Vector2(0, 0),
          },
        },
      ]),
      defines: {},
    });

    this.setValues(parameters);
  }

  setOffset(x: number, y: number) {
    this.offset.set(x, y);
    this._applyTransform();
  }

  setRepeat(x: number, y: number) {
    this.repeat.set(x, y);
    this._applyTransform();
  }

  set map(v: THREE.Texture) {
    if (this.setOffsetRepeatFromMap && v) {
      this.offset.set(v.offset.x, v.offset.y);
      this.repeat.set(v.repeat.x, v.repeat.y);
      this._applyTransform();
    }

    if (this.uniforms.map) {
      this.uniforms.map.value = v;
    }
  }

  get map() {
    if (!this.uniforms.map) {
      throw new Error("MeshBasicTintMaterial doesn't contain map uniform");
    }

    return this.uniforms.map.value;
  }

  private _applyTransform() {
    this.uvTransformMatrix.setUvTransform(
      this.offset.x,
      this.offset.y,
      this.repeat.x,
      this.repeat.y,
      this.rotation,
      this.center.x,
      this.center.y,
    );

    if (this.uniforms.mapTransform) {
      this.uniforms.mapTransform.value.copy(this.uvTransformMatrix);
    }
  }

  set color(v) {
    if (this.uniforms.diffuse) {
      this.uniforms.diffuse.value = v;
    }
  }

  get color() {
    if (!this.uniforms.diffuse) {
      throw new Error("MeshBasicTintMaterial doesn't contain diffuse uniform");
    }

    return this.uniforms.diffuse.value;
  }

  set tint(v) {
    if (this.uniforms.tintColor) {
      this.uniforms.tintColor.value = v;
    }
  }

  get tint(): THREE.Color {
    if (!this.uniforms.tintColor) {
      throw new Error("MeshBasicTintMaterial doesn't contain tintColor uniform");
    }

    return this.uniforms.tintColor.value;
  }

  set enableTint(v) {
    if (this.uniforms.tintFlag) {
      this.uniforms.tintFlag.value.x = v ? 1 : 0;
    }
  }

  get enableTint() {
    if (!this.uniforms.tintFlag) {
      throw new Error("MeshBasicTintMaterial doesn't contain tintFlag uniform");
    }

    return this.uniforms.tintFlag.value.x === 1;
  }

  set discardValue(v) {
    if (this.uniforms.discardValue) {
      this.uniforms.discardValue.value = v;
    }
  }

  get discardValue() {
    if (!this.uniforms.discardValue) {
      throw new Error("MeshBasicTintMaterial doesn't contain discardValue uniform");
    }

    return this.uniforms.discardValue.value;
  }

  set isDiscardEnabled(v) {
    if (this.uniforms.isDiscardEnabled) {
      this.uniforms.isDiscardEnabled.value = v ? 1 : 0;
    }
  }

  get isDiscardEnabled() {
    if (!this.uniforms.isDiscardEnabled) {
      throw new Error("MeshBasicTintMaterial doesn't contai isDiscardEnabled uniform");
    }

    return this.uniforms.isDiscardEnabled.value > 0;
  }

  get isLookingAtCamera() {
    if (!this.uniforms.isLookingAtCamera) {
      throw new Error("MeshBasicTintMaterial doesn't contain isLookingAtCamera uniform");
    }

    return this.uniforms.isLookingAtCamera.value > 0;
  }

  set isLookingAtCamera(v) {
    if (this.uniforms.isLookingAtCamera) {
      this.uniforms.isLookingAtCamera.value = v ? 1 : 0;
    }
  }

  set alpha(v) {
    if (!this.uniforms.opacity) {
      super.opacity = v;
    }

    this.uniforms.opacity.value = v;
  }

  get alpha() {
    if (!this.uniforms.opacity) {
      throw new Error("MeshBasicTintMaterial doesn't contain opacity uniform");
    }

    return this.uniforms.opacity.value;
  }
}
