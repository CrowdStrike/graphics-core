import { StringUtils } from "../graph-utils-v2/utils/string-utils";

export class FontLoader {
  fontNames: string[];
  loadPromise?: Promise<boolean | void>;
  private _isLoaded = false;

  constructor() {
    this.fontNames = [];
    this._isLoaded = false;
  }

  load(...args: string[]) {
    if (document.fonts) {
      this.fontNames.push(...args);

      if (!this.loadPromise) {
        this.loadPromise = Promise.all(
          this.fontNames.map(function (fontName) {
            return document.fonts.load(`16px ${fontName}`);
          }),
        )
          .then((e) => this.onFontLoaded(e))
          .catch((e) => this.onFontLoadedError(e))
          .finally(() => this.dispose());
      }

      return this.loadPromise;
    }

    return Promise.resolve();
  }

  onFontLoaded(e: unknown[][]) {
    let errorFlag = false;
    let fontsThatWorked: string[] = [];

    e.forEach((result: unknown[]) => {
      if (result[0] === undefined) {
        errorFlag = true;
      } else {
        fontsThatWorked.push(
          (result[0] as Record<string, unknown>).family as string,
        );
      }
    });

    if (errorFlag) {
      let fontString = this.fontNames.toString(); // work backwards - strip all loaded fonts that worked from the string / leave only fonts that had issues.

      fontsThatWorked.forEach((workingFont) => {
        fontString = StringUtils.replaceChar(fontString, workingFont, "");
      });

      throw new Error(
        `Error loading fonts: ${StringUtils.removeLeadingAndTrailingChars(
          fontString,
          ",",
        )}`,
      );
    }

    this._isLoaded = true;

    return true;
  }

  onFontLoadedError(e: any) {
    this._isLoaded = true;
    throw new Error(e.error);
  }

  dispose() {
    this.fontNames = [];
  }

  get isLoaded() {
    return this._isLoaded;
  }
}
