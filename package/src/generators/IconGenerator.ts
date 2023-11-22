import * as THREE from 'three';

import { MeshBasicTintMaterial } from '../materials/MeshBasicTintMaterial';
import { IconMesh } from '../objects/IconMesh';
import { MeshBasicTintMaterialPool } from '../pools/MeshBasicTintMaterialPool';
import { BitmapComposer } from '../textures/graphics/BitmapComposer';
import { GeomCache } from '../utils/GeomCache';

import type { TextureAtlasLoader } from '../loaders/TextureAtlasLoader';
import type { Rectangle } from '../utils/kurst/geom/Rectangle';

interface MaterialData {
  material: MeshBasicTintMaterial;
  bitmapComposer: BitmapComposer;
}

interface AddLayerParams {
  asset: string;
  color?: number;
  offset: THREE.Vector2;
  shouldCenterOnBackground?: boolean;
  alpha: number;
}

interface IconGeneratorMakeParams {
  shouldCache: boolean;
  IconMeshClass?: typeof IconMesh;
  shouldPool: boolean;
}

export class IconDefinition {
  textureAtlasLoader?: TextureAtlasLoader;
  width: number | null;
  height: number | null;
  padding: number;
  layers: IconLayer[] = [];
  resolution: string;

  constructor(
    textureAtlasLoader: TextureAtlasLoader,
    { width = null, height = null, padding = 2, resolution = '' } = {},
  ) {
    this.textureAtlasLoader = textureAtlasLoader;
    this.width = width;
    this.height = height;
    this.padding = padding;
    this.resolution = resolution;
  }

  addLayer({
    asset,
    color,
    offset = new THREE.Vector2(),
    shouldCenterOnBackground = false,
    alpha = 1,
  }: AddLayerParams) {
    let layer = new IconLayer({ asset: `${asset}${this.resolution}`, alpha, offset });

    layer.color = color;
    layer.shouldCenterOnBackground = shouldCenterOnBackground;
    layer.isBackground = this.layers.length === 0;

    this.layers.push(layer);
  }

  get id() {
    let layersId = this.layers.reduce((acc, layer) => {
      return `${acc}-${layer.color}-${layer.asset}-${layer.offset.x}-${layer.offset.y}-${layer.shouldCenterOnBackground}`;
    }, '');

    return `${this.width}-${this.height}:${layersId}`;
  }

  dispose() {
    this.textureAtlasLoader = undefined;
    this.layers = [];
    this.width = null;
    this.height = null;
  }

  calcIconSize() {
    if (!this.textureAtlasLoader) {
      throw new Error('textureAtlasLoader should not be undefined');
    }

    if (this.width && this.height) {
      return {
        width: this.width + this.padding,
        height: this.height + this.padding,
      };
    }

    let [backgroundLayer] = this.layers;

    if (!backgroundLayer) {
      throw new Error(`IconGenerator.calcIconSize(): no background layer exists`);
    }

    let backgroundBitmap = this.textureAtlasLoader.getBitmap(backgroundLayer.asset);

    return {
      width: backgroundBitmap.width + this.padding,
      height: backgroundBitmap.height + this.padding,
    };
  }
}

export class IconLayer {
  asset: string;
  offset;
  alpha: number;
  color?: number;
  rect?: Rectangle;
  isBackground = false;
  shouldCenterOnBackground = false;

  constructor({ asset, alpha = 1, offset = new THREE.Vector2() }: AddLayerParams) {
    this.asset = asset;
    this.alpha = alpha;
    this.offset = offset;
  }
}

export class IconGenerator {
  static _BITMAP_COMPOSER_CACHE: Record<string, BitmapComposer> = {};
  static _MATERIAL_CACHE: Record<string, MaterialData> = {};
  static _MATERIAL_POOL = new MeshBasicTintMaterialPool();
  static dispose() {
    Object.values(IconGenerator._BITMAP_COMPOSER_CACHE).forEach((bitmapComposer) => {
      bitmapComposer.dispose();
    });

    IconGenerator._BITMAP_COMPOSER_CACHE = {};
    IconGenerator._MATERIAL_POOL.dispose();
    IconGenerator._MATERIAL_POOL = new MeshBasicTintMaterialPool();
    IconGenerator._MATERIAL_CACHE = {};
  }

  static push(material: MeshBasicTintMaterial) {
    IconGenerator._MATERIAL_POOL.push(material);
  }

  static getIconMaterialData(
    iconDefinition: IconDefinition,
    { shouldCache = false, shouldPool = false } = {},
  ): MaterialData {
    let { id } = iconDefinition;
    let isIconCached = IconGenerator._MATERIAL_CACHE[id] !== undefined;

    if (isIconCached && shouldCache) {
      return IconGenerator._MATERIAL_CACHE[id] as MaterialData;
    }

    let bitmapComposer = IconGenerator._composeIcon(iconDefinition);
    let material;
    let texture = bitmapComposer.getTexture();

    if (shouldPool && texture) {
      material = IconGenerator._MATERIAL_POOL.pop();
      material.map = texture;
      material.color.set(0xffffff);
      material.transparent = true;
      material.side = THREE.DoubleSide;
      material.visible = true;
      material.alpha = material.opacity = 1;
      material.needsUpdate = true;
      bitmapComposer.applyMaterialOffsets(material);
    } else {
      material = new MeshBasicTintMaterial({
        map: texture,
        color: '#ffffff',
        transparent: true,
        side: THREE.DoubleSide,
      });
      bitmapComposer.applyMaterialOffsets(material);
    }

    let iconMaterialData = {
      material,
      bitmapComposer,
    };

    if (shouldCache) {
      IconGenerator._MATERIAL_CACHE[id] = iconMaterialData;
    }

    return iconMaterialData;
  }

  static update(
    mesh: IconMesh,
    iconDefinition: IconDefinition,
    { shouldCache = false, shouldPool = false } = {},
  ) {
    if (Array.isArray(mesh.material)) {
      throw new Error('IconGenerator.update does not support material arrays');
    }

    let isMeshBasicTintMaterial = mesh.material instanceof MeshBasicTintMaterial;

    if (!isMeshBasicTintMaterial) {
      throw new Error('IconGenerator.update requires mesh to use MeshBasicTintMaterial');
    }

    if (shouldPool) {
      IconGenerator._MATERIAL_POOL.push(mesh.material as MeshBasicTintMaterial);
    }

    let { material, bitmapComposer } = IconGenerator.getIconMaterialData(iconDefinition, {
      shouldCache,
      shouldPool,
    });

    mesh.bitmapComposer = bitmapComposer;
    mesh.material = material;

    return mesh;
  }

  static make(
    iconDefinition: IconDefinition,
    { shouldCache, IconMeshClass, shouldPool }: IconGeneratorMakeParams = {
      shouldCache: false,
      shouldPool: false,
    },
  ) {
    let { width, height } = iconDefinition.calcIconSize();
    let { material, bitmapComposer } = IconGenerator.getIconMaterialData(iconDefinition, {
      shouldCache,
      shouldPool,
    });
    let geom = GeomCache.getCachedPlaneGeometry(width, height);
    let MeshClass = IconMeshClass !== undefined ? IconMeshClass : IconMesh;

    if (MeshClass === undefined) {
      throw 'IconGenerator.make MeshClass should not be undefined';
    }

    let mesh = new MeshClass(geom, material);

    mesh.bitmapComposer = bitmapComposer;

    return mesh;
  }

  static _composeIcon(iconDefinition: IconDefinition) {
    let cachedBitmapComposer = IconGenerator._BITMAP_COMPOSER_CACHE[iconDefinition.id];

    if (cachedBitmapComposer) {
      return cachedBitmapComposer;
    }

    let { width, height } = iconDefinition.calcIconSize();
    let bitmapComposer = new BitmapComposer(width, height);
    let { layers, textureAtlasLoader } = iconDefinition;
    let backgroundLayer: IconLayer;

    layers.forEach((layer) => {
      if (layer.isBackground) {
        backgroundLayer = layer;
      }

      if (textureAtlasLoader === undefined) {
        throw new Error('IconGenerator _composeIcon textureAtlasLoader should not be undefined');
      }

      let bitmap = textureAtlasLoader.getBitmap(layer.asset);

      layer.rect = bitmap.rect.clone();

      switch (true) {
        case layer.isBackground:
          layer.rect.y = (bitmapComposer.height - bitmapComposer.height) / 2;
          layer.rect.x = (bitmapComposer.width - bitmapComposer.width) / 2;

          break;
        default:
          {
            if (backgroundLayer === undefined || backgroundLayer.rect === undefined) {
              throw new Error(
                'Icon generator background layer / layer rectangle should not be undefined',
              );
            }

            let x = Math.floor((backgroundLayer.rect.width - layer.rect.width) / 2) + layer.offset.x;
            let y = Math.floor((backgroundLayer.rect.height - layer.rect.height) / 2) + layer.offset.y + backgroundLayer.rect.y;

            layer.rect.x = x;
            layer.rect.y = y;
          }

          break;
      }

      bitmapComposer.draw(bitmap, layer.rect, layer.color, layer.alpha);
    });

    IconGenerator._BITMAP_COMPOSER_CACHE[iconDefinition.id] = bitmapComposer;

    return bitmapComposer;
  }
}
