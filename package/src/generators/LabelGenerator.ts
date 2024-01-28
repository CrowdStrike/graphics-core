import * as THREE from 'three';

import { MeshBasicTintMaterial } from '../materials/MeshBasicTintMaterial';
import { LabelMesh } from '../objects/LabelMesh';
import { TextGenerator } from '../textures/text/TextGenerator';
import { TextGeneratorCache } from '../textures/text/TextGeneratorCache';
import { GeomCache } from '../utils/GeomCache';

import type { TextStyle } from '../data/TextStyle';
import type { SpriteRegion } from '../textures/sprite-sheets/SpriteRegion';

export class LabelGenerator {
  static _objects: Record<string, LabelMesh> = {};
  static _textureByGeneratorCache: Record<string, THREE.Texture> = {};

  static getLabel() {
    return new LabelMesh();
  }

  static make(
    txt: string,
    style: TextStyle,
    { width = NaN, height = NaN, LabelMeshClass = LabelMesh, offset = new THREE.Vector3() } = {},
  ) {
    let textGenerator = TextGeneratorCache.renderToGenerator(style, txt, width, height);
    let texture = LabelGenerator._getCachedTexture(textGenerator);
    let material = new MeshBasicTintMaterial({
      map: texture,
      color: '#ffffff',
      side: THREE.DoubleSide,
      transparent: true,
    });
    let { spriteRegion } = textGenerator;

    if (!spriteRegion) {
      throw new Error('SpriteRegion is not defined');
    }

    material.setOffsetRepeatFromMap = false;
    material.enableTint = true;
    material.tint.setHex(style.fontColor);

    LabelGenerator._updateMaterialRepeatOffset(material, spriteRegion);

    let geometry = GeomCache.getCachedPlaneGeometry(spriteRegion.rect.width, spriteRegion.rect.height, offset);
    let label = new LabelMeshClass(geometry, material) as LabelMesh;

    label.texture = texture;
    label.textGenerator = textGenerator;
    label.style = style;
    label.text = txt;
    label.needsUpdate = true;
    label.spriteSheetIdx = TextGenerator.getSpriteSheetGenerator().getPageForDynamicSpriteSheetId(
      spriteRegion?.spriteSheet?.id || '',
    );

    LabelGenerator._objects[label.uuid] = label;

    return label;
  }

  static getCanvases() {
    return this._textureByGeneratorCache;
  }

  static makeTexture(txt: string, style: TextStyle, width = NaN, height = NaN) {
    let textGenerator = TextGeneratorCache.renderToGenerator(style, txt, width, height);

    return {
      textGenerator,
      texture: LabelGenerator._getCachedTexture(textGenerator),
    };
  }

  static update(
    label: LabelMesh,
    txt: string,
    style = label.style,
    { width = label.width, height = label.height, offset = new THREE.Vector3() } = {},
  ) {
    if ((txt === label.text && style === label.style) || !style) {
      return;
    }

    let textGenerator = TextGeneratorCache.renderToGenerator(style, txt, width, height);
    let newWidth = textGenerator.textWidth;
    let oldWidth = label.textGenerator?.textWidth;

    if (newWidth !== oldWidth && style?.autoResize === true) {
      label.geometry = GeomCache.getCachedPlaneGeometry(textGenerator.textWidth, height, offset);
      label.needsUpdate = true;
    }

    if (!textGenerator.spriteRegion) {
      throw new Error('LabelGenerator.update text generator has no spriteRegion');
    }

    LabelGenerator._updateMaterialRepeatOffset(label.material as MeshBasicTintMaterial, textGenerator.spriteRegion);

    label.texture = this._getCachedTexture(textGenerator);

    let material = label.material as MeshBasicTintMaterial;

    material.map = label.texture;
    material.tint.setHex(style?.fontColor);
    label.textGenerator = textGenerator;
    label.style = style;
    label.text = txt;
    label.needsUpdate = true;

    return label;
  }

  static _updateMaterialRepeatOffset(material: MeshBasicTintMaterial, spriteRegion: SpriteRegion) {
    spriteRegion.applyMaterialOffsets(material);
  }

  static _getCachedTexture(textGenerator: TextGenerator) {
    if (LabelGenerator._textureByGeneratorCache[textGenerator.uuid] === undefined) {
      LabelGenerator._textureByGeneratorCache[textGenerator.uuid] = new THREE.Texture(textGenerator.canvas);

      const t = LabelGenerator._textureByGeneratorCache[textGenerator.uuid] as THREE.Texture;

      t.needsUpdate = true;
    }

    return LabelGenerator._textureByGeneratorCache[textGenerator.uuid];
  }

  static dispose() {
    let keys = Object.keys(LabelGenerator._objects);
    let l = keys.length;
    let label;

    for (let c = 0; c < l; c++) {
      label = LabelGenerator._objects[keys[c] as string] as LabelMesh;

      if (label.texture) {
        label.texture.dispose();
        label.texture.image = null;
        label.texture = undefined;
      }

      if (label.texture && !Array.isArray(label.material)) {
        let material = label.material as MeshBasicTintMaterial;

        material.dispose();
      }

      if (label.texture) {
        label.geometry.dispose();
      }

      delete LabelGenerator._objects[keys[c] as string];
    }

    TextGeneratorCache.dispose();

    LabelGenerator._objects = {};
    LabelGenerator._textureByGeneratorCache = {};
  }
}
