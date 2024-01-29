import { TextGenerator } from './TextGenerator';

import type { TextStyle } from '../../data/TextStyle';

export class TextGeneratorCache {
  static _textGeneratorCache: Record<string, TextGenerator> = {};

  /**
   * @param textStyle : TextStyle
   * @param label : String
   * @param width : Number
   * @param height : Number
   * @returns {TextGenerator}
   */
  static renderToGenerator(textStyle: TextStyle, label: string, width: number, height: number): TextGenerator {
    let textureKey = TextGeneratorCache.getTextureKey(textStyle, label);

    if (!TextGeneratorCache._textGeneratorCache[textureKey]) {
      let textGen = new TextGenerator(width, height, textStyle);

      textGen.render(label);
      TextGeneratorCache._textGeneratorCache[textureKey] = textGen;
    }

    return TextGeneratorCache._textGeneratorCache[textureKey] as TextGenerator;
  }

  /**
   * @param textStyle : TextStyle
   * @param label : String
   * @returns {boolean}
   */
  static isTextureGeneratorCached(textStyle: TextStyle, label: string) {
    return TextGeneratorCache._textGeneratorCache[TextGeneratorCache.getTextureKey(textStyle, label)] != null;
  }

  /**
   * get a key object to identified cached textures
   * @param textStyle
   * @param label
   * @returns {string}
   */
  static getTextureKey(textStyle: TextStyle, label: string) {
    return `${label}_${textStyle._idc}`;
  }

  static dispose() {
    Object.values(TextGeneratorCache._textGeneratorCache).forEach((textGen) => {
      textGen.dispose();
    });

    TextGeneratorCache._textGeneratorCache = {};
  }
}
