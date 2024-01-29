import { Event } from '../../graph-utils-v2/events/event';
import { EventDispatcher } from '../../graph-utils-v2/events/event-dispatcher';
import { FontLoader } from '../../loaders/FontLoader';
import { TextureAtlasLoader } from '../../loaders/TextureAtlasLoader';

import type { Atlas } from '../../loaders/TextureAtlasLoader';

interface AssetLoaderParams {
  fonts: string[];
}

export class AssetLoader extends EventDispatcher {
  areAllAssetsLoaded = false;

  atlas?: TextureAtlasLoader = new TextureAtlasLoader();
  fontLoader?: FontLoader = new FontLoader();
  fonts?: string[];

  constructor(settings: AssetLoaderParams) {
    super();

    this.fonts = settings.fonts;
  }

  load(url: string, spritesJson: Atlas) {
    this.areAllAssetsLoaded = false;
    this.atlas?.addEventListener(Event.COMPLETE, this._checkLoaded, this);
    this.atlas?.addEventListener(Event.ERROR, this._onAssetLoadError, this);
    this.atlas?.load(spritesJson, url);

    if (this.fonts && this.fontLoader) {
      this.fontLoader
        .load(...this.fonts)
        .then(() => this._checkLoaded())
        .catch((e: Event) => this._fontLoadError(e));
    }
  }

  private _onAssetLoadError() {
    this.dispatchEvent(new Event(Event.ERROR));
  }

  private _checkLoaded() {
    if (this.atlas && this.fontLoader && this.fontLoader.isLoaded && this.atlas.isLoaded) {
      this.areAllAssetsLoaded = true;
      this.dispatchEvent(new Event(Event.COMPLETE));
    }
  }

  private _fontLoadError(e: Event) {
    // eslint-disable-next-line no-console
    console.error(e);
    this._checkLoaded();
  }

  dispose() {
    this.atlas?.removeEventListener(Event.COMPLETE, this._checkLoaded, this);
    this.atlas?.removeEventListener(Event.ERROR, this._onAssetLoadError, this);
    this.atlas?.dispose();
    this.atlas = undefined;

    this.fontLoader?.dispose();
    this.fontLoader = undefined;

    this.fonts = undefined;

    super.dispose();
  }
}
