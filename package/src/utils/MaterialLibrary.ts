import * as THREE from 'three';

import { TextStyle } from '../data/TextStyle';
import { Color } from '../graph-utils-v2/geom/color';

import type { LineBasicMaterialParameters, LineDashedMaterialParameters } from 'three';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

const NODE_LOADING_COLOR = '#e0e0e0';

export const LINE_MATERIALS = {
  DEFAULT: 0xd8d8d8,
  SELECTED: 0x007899,
  ROLL_OVER: 0x00a0cc,
};

export class MaterialLibrary {
  static _textStyleDictionary: Record<string, TextStyle> = {};
  static _nodeMaterialDictionary: Record<string, THREE.MeshBasicMaterial> = {};
  static _lineMaterialDictionary: Record<string, THREE.LineBasicMaterial | THREE.LineDashedMaterial> = {};

  static _line2MaterialDictionary: Record<string, LineMaterial> = {};
  static _tempColor = new Color();
  static _arrowMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    emissive: 0x0e0e0e,
  });

  static getArrowMaterial() {
    return MaterialLibrary._arrowMaterial;
  }

  static dispose() {
    Object.values(MaterialLibrary._lineMaterialDictionary).forEach((material) => material.dispose());
    Object.values(MaterialLibrary._line2MaterialDictionary).forEach((material) => material.dispose());
    Object.values(MaterialLibrary._nodeMaterialDictionary).forEach((material) => material.dispose());

    MaterialLibrary._textStyleDictionary = {};
    MaterialLibrary._nodeMaterialDictionary = {};
    MaterialLibrary._lineMaterialDictionary = {};
    MaterialLibrary._line2MaterialDictionary = {};
  }

  static getNodeLoadingMaterial(color = null) {
    return MaterialLibrary.getNodeMaterialByColor(color || NODE_LOADING_COLOR);
  }

  static getNodeMaterialByColor(colorString: string) {
    if (!MaterialLibrary._nodeMaterialDictionary[colorString]) {
      MaterialLibrary._tempColor.setStyle(colorString);
      MaterialLibrary._nodeMaterialDictionary[colorString] = new THREE.MeshBasicMaterial({
        color: MaterialLibrary._tempColor.getHex(),
      });
    }

    return MaterialLibrary._nodeMaterialDictionary[colorString];
  }

  static getMeshLambertMaterialByColor(colorString: string, emissiveColorString = '#000000') {
    let id = `MeshLambertMaterial-${colorString}-${emissiveColorString}`;

    if (!MaterialLibrary._nodeMaterialDictionary[id]) {
      MaterialLibrary._tempColor.setStyle(colorString);

      let color = MaterialLibrary._tempColor.getHex();

      MaterialLibrary._tempColor.setStyle(emissiveColorString);

      let emissive = MaterialLibrary._tempColor.getHex();

      MaterialLibrary._nodeMaterialDictionary[id] = new THREE.MeshLambertMaterial({
        color,
        emissive,
      });
    }

    return MaterialLibrary._nodeMaterialDictionary[id];
  }

  static getLineMaterial(
    lineColor: number,
    { shouldUseVertexColors = false, isDashedLine = false, dashSize = 3, gapSize = 1 } = {},
  ) {
    let materialKey = `${lineColor}-${shouldUseVertexColors}-${isDashedLine}-${dashSize}-${gapSize}`;

    if (!MaterialLibrary._lineMaterialDictionary[materialKey]) {
      MaterialLibrary._lineMaterialDictionary[materialKey] = MaterialLibrary.createNewLineMaterial(lineColor, {
        shouldUseVertexColors,
        isDashedLine,
        dashSize,
        gapSize,
      });
    }

    return MaterialLibrary._lineMaterialDictionary[materialKey];
  }

  static createNewLineMaterial(
    lineColor: number,
    { shouldUseVertexColors = false, isDashedLine = false, dashSize = 3, gapSize = 1 } = {},
  ) {
    let lineBasicMaterialProperties = shouldUseVertexColors
      ? MaterialLibrary._getLineMaterialPropertiesForVertexColors()
      : MaterialLibrary._getLineMaterialProperties(lineColor);

    let lineMaterial;

    if (isDashedLine) {
      let dashedLineProperties = Object.assign({}, lineBasicMaterialProperties, {
        dashSize,
        gapSize,
      });

      lineMaterial = new THREE.LineDashedMaterial(dashedLineProperties as LineDashedMaterialParameters);
    } else {
      lineMaterial = new THREE.LineBasicMaterial(lineBasicMaterialProperties as LineBasicMaterialParameters);
    }

    return lineMaterial;
  }

  static _getLineMaterialPropertiesForVertexColors() {
    return {
      transparent: true,
      vertexColors: true,
    };
  }

  static _getLineMaterialProperties(lineMaterialId: number) {
    return {
      transparent: true,
      color: lineMaterialId,
    };
  }

  static getNodeTextStyle(
    colorString: string,
    { fontSize = 28, fontName = 'Calibre', pixelDensity = 1 } = {},
  ): TextStyle {
    let key = `${colorString}-${fontSize}-${fontName}-${pixelDensity}`;

    if (!MaterialLibrary._textStyleDictionary[key]) {
      MaterialLibrary._tempColor.setStyle(colorString);

      let style = new TextStyle();

      style.name = `node-mesh-label-${key}`;
      style.fontSize = fontSize;
      style.fontColor = MaterialLibrary._tempColor.getHex();
      style.fontName = fontName;
      style.pixelDensity = pixelDensity;

      MaterialLibrary._textStyleDictionary[key] = style;
    }

    return MaterialLibrary._textStyleDictionary[key] as TextStyle;
  }
}
