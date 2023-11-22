import * as THREE from 'three';

import { MeshBasicTintMaterial } from '../materials/MeshBasicTintMaterial';
import { DynamicSpriteSheetGenerator } from '../textures/sprite-sheets/DynamicSpriteSheetGenerator';
import { GeomCache } from '../utils/GeomCache';
import { BitmapData } from '../utils/kurst/display/BitmapData';

import type { SpriteRegion } from '../textures/sprite-sheets/SpriteRegion';

interface IconSvgData {
  id: string;
  geometries?: THREE.ShapeGeometry[];
  material?: MeshBasicTintMaterial;
  region?: SpriteRegion;
  width: number;
  height: number;
  svg: HTMLElement;
}

interface IconMetrics {
  width: number;
  height: number;
}

export class SvgMeshGenerator {
  private static _svgGeometries: Map<string, IconSvgData> = new Map();
  private static _spriteSheet = new DynamicSpriteSheetGenerator(4096, 4096);
  private static _scaleSvgImage = 3;
  private static _hasRegisteredIcons = false;

  private static svgElementToBlob(svg: HTMLElement): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };

      img.src =
        'data:image/svg+xml; charset=utf8, ' +
        encodeURIComponent(new XMLSerializer().serializeToString(svg));
    });
  }

  static hasRegisteredIcon(id: string) {
    return this._svgGeometries.has(id);
  }

  static hasRegisteredIcons() {
    return this._hasRegisteredIcons;
  }

  static async registerSvgMaterial(id: string, svg: HTMLElement) {
    let material = this._svgGeometries.get(id)?.material;

    if (material) {
      return material;
    }

    const width = parseInt(svg.getAttribute('width') || '24', 10) * this._scaleSvgImage;
    const height = parseInt(svg.getAttribute('height') || '24', 10) * this._scaleSvgImage;
    const iconPadding = 4;

    const icon = new BitmapData(width + 2 * iconPadding, height + 2 * iconPadding, false);

    return this.svgElementToBlob(svg).then((img) => {
      if (!icon.context) return;

      /**
       * when having multiple graphs on the same page, the svgElementToBlob promise can be waiting multiple
       * copies of the same icon to be registered. This creates a condition where the same icon can be drawn
       * to the sprite-sheet multiple times.
       *
       * We fix this by adding a second check to see whether that icon has been registered in a previous promise
       */
      let materialCachedPendingBlobGeneration = this._svgGeometries.get(id)?.material;

      if (materialCachedPendingBlobGeneration) {
        return materialCachedPendingBlobGeneration;
      }

      icon.context.drawImage(img, iconPadding, iconPadding, width, height);

      // remove reference and let garbage collection do its thing
      img.remove();

      const region = this._spriteSheet.requestRegion(icon.width, icon.height);

      if (!region || !region.bitmap || !region.spriteSheet) {
        throw new Error();
      }

      region.bitmap.copyPixels(icon, icon.rect, region.rect);

      icon.dispose();

      let material = new MeshBasicTintMaterial({
        map: region.spriteSheet.texture,
        color: '#ffffff',
        transparent: true,
        side: THREE.DoubleSide,
      });

      region.applyMaterialOffsets(material);

      this._svgGeometries.set(id, {
        material,
        width,
        height,
        region,
        id,
        svg,
        ...this._svgGeometries.get(id),
      });

      return material;
    });
  }

  static hasIcon(id: string) {
    return this._svgGeometries.has(id);
  }

  static get icons() {
    return Array.from(this._svgGeometries.values());
  }

  static freezeSpritesheet() {
    this._spriteSheet.freeze();
  }

  static onIconsLoaded() {
    this.freezeSpritesheet();
    this._hasRegisteredIcons = true;
  }

  static getGeometry(id: string) {
    let iconSvgData = this._svgGeometries.get(id);

    if (!iconSvgData) {
      throw new Error(`SvgMeshGenerator.getGeometry: ${id} IconSvgData not found`);
    }

    return iconSvgData.geometries;
  }

  static getMaterial(id: string) {
    let iconSvgData = this._svgGeometries.get(id);

    if (!iconSvgData) {
      throw new Error(`SvgMeshGenerator.getMaterial: ${id} IconSvgData not found`);
    }

    return iconSvgData.material;
  }

  static getIconMetadata(id: string) {
    let iconSvgData = this._svgGeometries.get(id);

    if (!iconSvgData) {
      throw new Error(`SvgMeshGenerator.getMaterial: ${id} IconSvgData not found`);
    }

    return iconSvgData;
  }

  static getIconList() {
    let iconData: IconSvgData[] = [];

    this._svgGeometries.forEach((value) => {
      iconData.push(value);
    });

    return iconData;
  }

  static getIconMetrics(id: string): IconMetrics {
    let iconSvgData = this._svgGeometries.get(id);

    if (!iconSvgData) {
      throw new Error(`SvgMeshGenerator.getIconData: ${id} IconSvgData not found`);
    }

    return {
      width: iconSvgData.width / this._scaleSvgImage,
      height: iconSvgData.height / this._scaleSvgImage,
    };
  }

  static create(id: string) {
    const group = new THREE.Group();

    const tmp = SvgMeshGenerator.getMaterial(id);

    let materialWOffset = new MeshBasicTintMaterial({
      map: tmp?.map,
      color: '#ffffff',
      side: THREE.DoubleSide,
      transparent: true,
    });

    materialWOffset.setOffset(tmp?.offset?.x ?? 0, tmp?.offset.y ?? 0);
    materialWOffset.setRepeat(tmp?.repeat?.x ?? 1, tmp?.repeat.y ?? 1);

    const { width, height } = this.getIconMetrics(id);
    const geom = GeomCache.getCachedPlaneGeometry(width, height);

    const mesh = new THREE.Mesh(geom, materialWOffset);

    group.add(mesh);

    return group;
  }

  static get spriteSheet() {
    return this._spriteSheet;
  }

  static dispose() {
    SvgMeshGenerator._svgGeometries = new Map();
    SvgMeshGenerator._spriteSheet = new DynamicSpriteSheetGenerator(4096, 4096);
    SvgMeshGenerator._scaleSvgImage = 3;
    SvgMeshGenerator._hasRegisteredIcons = false;
  }
}
