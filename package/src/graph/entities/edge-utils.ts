import gsap from "gsap";
import { LineBasicMaterial, LineDashedMaterial } from "three";

import { ColorUtils } from "../../graph-utils-v2/utils/color-utils";
import { NumberUtils } from "../../graph-utils-v2/utils/number-utils";

import type { LineGradientMaterial } from "../../materials/LineGradientMaterial";
import type { Object3D } from "three";

export enum LineStyles {
  SOLID,
  DASHED,
}

interface LineMaterialConfig {
  color: string;
  shouldAnimate?: boolean;
}

export function createLineMaterial(
  lineStyle: LineStyles.DASHED | LineStyles.SOLID | undefined,
  config: LineMaterialConfig
): LineBasicMaterial | LineDashedMaterial {
  if (lineStyle === LineStyles.DASHED) {
    return new LineDashedMaterial({
      transparent: true,
      opacity: Number(config.shouldAnimate) ?? 1,
      color: ColorUtils.colorValueToHexInt(config.color),
      dashSize: 10,
      gapSize: 4,
    });
  }

  return new LineBasicMaterial({
    transparent: true,
    opacity: config.shouldAnimate ? Number(!config.shouldAnimate) : 1,
    color: ColorUtils.colorValueToHexInt(config.color),
  });
}

export function fadeInLineMaterial(
  material: LineBasicMaterial | LineDashedMaterial | LineGradientMaterial
) {
  gsap.to(material, {
    delay: NumberUtils.random(0.1, 0.2),
    duration: 0.75,
    opacity: 1,
    onComplete: () => {
      material.transparent = false;
    },
  });
}

export function toggleLineVisibility(
  parent: Object3D,
  line: Object3D,
  isVisible?: boolean
) {
  if (isVisible && !line.parent) {
    parent.add(line);
  } else if (isVisible === false && line.parent) {
    parent.remove(line);
  }
}
