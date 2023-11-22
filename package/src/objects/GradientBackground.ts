import * as THREE from 'three';

import { GradientFragmentShader, GradientVertexShader } from '../shaders/GradientShader';
import { ColorTweenProxy } from '../utils/ColorTweenProxy';

import type { IUniform } from 'three';

export class GradientBackground extends THREE.Mesh {
  uniforms: { [uniform: string]: IUniform };
  colorProxyStart: ColorTweenProxy;
  colorProxyEnd: ColorTweenProxy;
  constructor({ startColor, endColor }: { startColor: number; endColor: number }) {
    super();

    this.uniforms = {
      color1: {
        value: new THREE.Color(startColor),
      },
      color2: {
        value: new THREE.Color(endColor),
      },
      opacity: {
        value: 1.0,
      },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: GradientVertexShader,
      fragmentShader: GradientFragmentShader,
    });

    this.geometry = new THREE.PlaneGeometry(2, 2, 1);
    this.frustumCulled = false;

    this.colorProxyStart = new ColorTweenProxy({
      id: 'start',
      color: startColor,
      onUpdate: (color, id) => this.onUpdateColor(color, id),
      onComplete: (color, id) => this.onUpdateColor(color, id),
    });

    this.colorProxyEnd = new ColorTweenProxy({
      id: 'end',
      color: endColor,
      onUpdate: (color, id) => this.onUpdateColor(color, id),
      onComplete: (color, id) => this.onUpdateColor(color, id),
    });
  }

  update({ startColor, endColor }: { startColor: number; endColor: number }) {
    this.uniforms.color1.value.setHex(startColor);
    this.uniforms.color2.value.setHex(endColor);
  }

  animateTo({ startColor, endColor }: { startColor: number; endColor: number }) {
    this.colorProxyStart.to({ targetColor: startColor, duration: 2 });
    this.colorProxyEnd.to({ targetColor: endColor, duration: 2 });
  }

  get opacity() {
    return this.uniforms.opacity.value;
  }

  set opacity(value) {
    this.uniforms.opacity.value = value;
  }

  onUpdateColor(color: number, id: string): void {
    if (id === 'start') {
      this.uniforms.color1.value.setHex(color);

      return;
    }

    this.uniforms.color2.value.setHex(color);
  }

  dispose() {
    this.colorProxyStart.dispose();
    this.colorProxyEnd.dispose();
  }
}
