import * as THREE from "three";

import { Event } from "../graph-utils-v2/events/event";
import { EventDispatcher } from "../graph-utils-v2/events/event-dispatcher";
import { MeshBasicTintMaterial } from "../materials/MeshBasicTintMaterial";
import { BitmapData } from "../utils/kurst/display/BitmapData";
import { Rectangle } from "../utils/kurst/geom/Rectangle";

interface FrameInfo {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface SpriteInfo {
  frame: FrameInfo;
}

export interface Atlas {
  frames: Record<string, SpriteInfo>;
}

export class TextureAtlasLoader extends EventDispatcher {
  private _textureLoader? = new THREE.TextureLoader(); // Texture loaded
  private _atlas?: Atlas = undefined; // Loaded JSON
  private _texturesCache: Record<string, THREE.Texture> = {}; // cache of texture sprite sheet items
  private _loadedTexture?: THREE.Texture = undefined; // reference to the loaded texture atlas
  private _bitmapCache: Record<string, BitmapData> = {}; // cache of bitmap data sprite sheet items
  private _textureSizeCache: Record<string, Rectangle> = {}; // cache of rectangle sizes for sprite sheet items ( avoids creating rectangles all the time )
  private _isLoaded = false;
  private isTextureLoaded = false;

  constructor(crossOrigin = "use-credentials") {
    super();
    this._textureLoader = new THREE.TextureLoader(); // Texture loaded
    this._textureLoader.setCrossOrigin(crossOrigin);
  }

  dispose() {
    this._loadedTexture?.dispose();
    this._textureLoader = undefined;
    this._atlas = undefined;

    let keys;
    let l;
    let c;

    if (this._texturesCache) {
      keys = Object.keys(this._texturesCache) as string[];
      l = keys.length;

      for (c = 0; c < l; c++) {
        this._texturesCache[keys[c] as string]?.dispose();
      }
    }

    if (this._bitmapCache) {
      keys = Object.keys(this._bitmapCache);
      l = keys.length;

      for (c = 0; c < l; c++) {
        this._bitmapCache[keys[c] as string]?.dispose();
      }
    }

    if (this._loadedTexture) {
      this._loadedTexture.dispose();
    }

    this._texturesCache = {};
    this._loadedTexture = undefined;
    this._bitmapCache = {};
    this._textureSizeCache = {};
  }

  load(atlas: Atlas, imageUrl: string) {
    this._atlas = Object.assign({}, atlas);

    if (this.isTextureLoaded) {
      this.dispatchEvent(new Event(Event.COMPLETE));
    } else {
      this._loadedTexture = this._textureLoader?.load(
        imageUrl,
        () => this._onTextureLoaded(),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
        () => this._onTextureLoadError()
      );
    }
  }

  enum() {
    let result: string[] = [];

    for (let i in this._atlas?.frames) {
      result.push(i);
    }

    return result;
  }

  _onTextureLoadError() {
    this.dispatchEvent(new Event(Event.ERROR));
  }

  getBitmap(name: string): BitmapData {
    let atlasTexture = this._atlas?.frames[name];

    if (!atlasTexture) {
      throw new Error(`Texture ${name} does not exist in altas`);
    }

    if (!this._bitmapCache[name]) {
      let frameInfo = atlasTexture.frame;
      let bitmap = new BitmapData(frameInfo.w, frameInfo.h, true);
      let texture = this.getLoadedTexture();
      let image = texture?.image;
      let sourceRect = new Rectangle(
        frameInfo.x,
        frameInfo.y,
        frameInfo.w,
        frameInfo.h
      );

      bitmap.copyPixels(image, sourceRect, bitmap.rect);
      this._bitmapCache[name] = bitmap;
    }

    return this._bitmapCache[name] as BitmapData;
  }

  getMaterial(name: string) {
    if (this._atlas?.frames[name]) {
      let tx = this.getLoadedTexture();
      let txData = this._atlas.frames[name] as SpriteInfo;
      let txFrame = txData.frame;
      let material = new MeshBasicTintMaterial({
        map: tx,
        color: "#ffffff",
        transparent: true,
        side: THREE.DoubleSide,
      });

      if (tx?.image !== undefined) {
        material.setRepeat(
          txFrame.w / tx.image.width,
          txFrame.h / tx.image.height
        );
        material.setOffset(
          txFrame.x / tx.image.width,
          1 - txFrame.h / tx.image.height - txFrame.y / tx.image.height
        );
      }

      return material;
    }

    throw new Error(`Texture ${name} does not exist in altas`);
  }

  getTexture(name: string) {
    if (this._atlas?.frames[name]) {
      return this._getCachedTexture(name);
    }

    throw new Error(`Texture ${name} does not exist in altas`);
  }

  get isLoaded() {
    return this._isLoaded;
  }

  getTextureSize(name: string) {
    if (this._atlas?.frames[name]) {
      if (this._textureSizeCache[name]) {
        return this._textureSizeCache[name];
      }

      let spriteInfo = this._atlas.frames[name] as SpriteInfo;
      let frameInfo = spriteInfo.frame;
      let rect = new Rectangle(0, 0, frameInfo.w, frameInfo.h);

      this._textureSizeCache[name] = rect;

      return rect;
    } else {
      throw new Error(`Texture ${name} does not exist in altas`);
    }
  }

  getLoadedTexture() {
    return this._loadedTexture;
  }

  hasBitmap(name: string) {
    return this._atlas?.frames[name] !== undefined;
  }

  private _getCachedTexture(name: string) {
    let tx = this.getLoadedTexture()?.clone();
    let txData = this._atlas?.frames[name];
    let txFrame = txData?.frame;

    if (!this._texturesCache[name] && tx && txData && txFrame) {
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      tx.repeat.set(txFrame.w / tx.image.width, txFrame.h / tx.image.height);
      tx.offset.x = txFrame.x / tx.image.width;
      tx.offset.y =
        1 - txFrame.h / tx.image.height - txFrame.y / tx.image.height;
      tx.needsUpdate = true;
      this._texturesCache[name] = tx;
    }

    return this._texturesCache[name];
  }

  private _onTextureLoaded() {
    this.isTextureLoaded = true;
    this._checkLoaded();
  }

  private _checkLoaded() {
    if (this.isTextureLoaded) {
      this._isLoaded = true;
      this.dispatchEvent(new Event(Event.COMPLETE));
    }
  }
}
