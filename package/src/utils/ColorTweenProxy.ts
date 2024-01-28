import gsap from 'gsap';
import * as THREE from 'three';

interface ColorTweenProxyParams {
  id: string;
  color: number | string;
  onUpdate: (color: number, id: string) => void;
  onComplete: (color: number, id: string) => void;
}

export class ColorTweenProxy {
  _onUpdate: (color: number, id?: string) => void;
  _onComplete: (color: number, id?: string) => void;
  color: THREE.Color;
  lerpAlpha: number;
  targetColor: THREE.Color;
  id;

  constructor({ id, color, onUpdate = () => undefined, onComplete = () => undefined }: ColorTweenProxyParams) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this._onUpdate = onUpdate;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this._onComplete = onComplete;
    this.color = new THREE.Color(color);
    this.lerpAlpha = 0;
    this.targetColor = new THREE.Color();
    this.id = id;
  }

  dispose() {
    gsap.killTweensOf(this);
    this._onUpdate = () => undefined;
    this._onComplete = () => undefined;
  }

  setUpdateHandler(onUpdate: () => void) {
    this._onUpdate = onUpdate;
  }

  setCompleteHandler(onComplete: () => void) {
    this._onComplete = onComplete;
  }

  stop() {
    gsap.killTweensOf(this);
  }

  setColor(hex: number) {
    this.color.set(hex);
  }

  to({
    delay = 0,
    duration = 0.5,
    targetColor = 0x000000,
    startColor = undefined,
  }: {
    delay?: number;
    duration?: number;
    targetColor: number;
    startColor?: number;
  }) {
    if (startColor) {
      this.setColor(startColor);
    }

    this.targetColor.setHex(targetColor);
    this.lerpAlpha = 0;

    if (duration === 0) {
      this.color.lerp(this.targetColor, 1);
      this._onCompleteTween();
    } else {
      this.stop();
      gsap.to(this, {
        duration,
        delay,
        lerpAlpha: 1,
        onComplete: this._onCompleteTween,
        callbackScope: this,
        onUpdate: this._onUpdateTween,
      });
    }
  }

  _onUpdateTween() {
    this.color.lerp(this.targetColor, this.lerpAlpha);
    this._onUpdate(this.color.getHex(), this.id);
  }

  _onCompleteTween() {
    this.color.set(this.targetColor.getHex());
    this._onUpdate(this.color.getHex(), this.id);
    this._onComplete(this.color.getHex(), this.id);
  }
}
