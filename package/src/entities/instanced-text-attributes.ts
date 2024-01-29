import { TextStyle } from '../data/TextStyle';
import { LabelGenerator } from '../generators/LabelGenerator';
import { StringUtils } from '../graph-utils-v2/utils/string-utils';
import { TextGenerator } from '../textures/text/TextGenerator';
import { UNKNOWN_INSTANCE_IDX } from './instanced-attributes';
import { InstancedIconAttributes } from './instanced-icon-attributes';

import type { EntityWithId, UiBadgeConfiguration } from './instanced-attributes';

export enum LabelPosition {
  right = 'right',
  bottom = 'bottom',
}

export enum InstancedTextAlignment {
  start = 'start',
  middle = 'middle',
}

type TruncationStrategy = 'start' | 'end' | 'middle';

export interface InstancedTextConfiguration {
  alignment?: InstancedTextAlignment;
  textureAtlas?: HTMLCanvasElement;
  truncationLength: number;
  truncationStrategy?: TruncationStrategy;
  pixelDensity: number; // 3
}

const PLANE_GEOMETRY_WIDTH = 1;
const PLANE_GEOMETRY_HEIGHT = 1;

/**
 * Instanced text is a special type of instanced icons,
 * with some storing of aspect ratio and a lookup dictionary
 * for index/string, and memoization of TextStyle.
 *
 * And also an array for additional meshes, in case we fill
 * the texture atlas that holds the strings.
 */
export class InstancedTextAttributes extends InstancedIconAttributes {
  // For label rendering
  declare textStyle: TextStyle;
  hasRegisteredTextStyle = false;
  hasUpdatedMaterialWithFirstSpritesheet = false;

  textLookup: Map<number, string> = new Map();

  // Persists positional offsets for each index
  // This can be used for when we want to move around the text
  // on top of position/scale transformations, which might be
  // recursively called from a parent instanced entity
  positionOffsetLookup: Map<number, [number, number]> = new Map();

  // UI config-specific
  alignment: InstancedTextAlignment = InstancedTextAlignment.middle;
  truncationLength?: number;
  truncationStrategy?: TruncationStrategy;
  pixelDensity: number;

  // uiConfig is only necessary if this class is to be used as a badge
  constructor(textConfig: InstancedTextConfiguration, uiConfig?: UiBadgeConfiguration) {
    let { textureAtlas } = textConfig;

    // There's a case that the provided
    // textSpriteSheetGenerator.spriteSheets[0].canvas
    // will be undefined. This is a check to guard against that case.
    if (!(textureAtlas instanceof HTMLCanvasElement)) {
      const textSpriteSheetGenerator = TextGenerator.getSpriteSheetGenerator();

      if (!textSpriteSheetGenerator.spriteSheets[0]?.canvas) {
        textSpriteSheetGenerator.requestRegion(2048, 2048);
      }

      textureAtlas = textSpriteSheetGenerator.spriteSheets[0].canvas as HTMLCanvasElement;
    }

    super(
      {
        textureAtlas,
      },
      uiConfig,
    );

    this.alignment = textConfig.alignment || InstancedTextAlignment.middle;
    this.pixelDensity = textConfig.pixelDensity;
    this.truncationLength = textConfig.truncationLength;
    this.truncationStrategy = textConfig.truncationStrategy;

    this.registerTextStyle(new TextStyle({ pixelDensity: this.pixelDensity }));
  }

  changeText() {
    this.changeText;
  }

  remove(vertex: EntityWithId): void {
    const { id } = vertex;
    // where is this instance located?
    // NB this needs to happen before super.remove(vertex)
    // because this will remove id from this.dataForId
    const instanceIdx = this.dataForId(id);

    super.remove(vertex);

    if (instanceIdx !== UNKNOWN_INSTANCE_IDX) {
      this.textLookup.delete(instanceIdx);
    }
  }

  registerTextStyle(style: TextStyle) {
    this.textStyle = style;
    this.hasRegisteredTextStyle = true;
  }

  private registerTextAt(idx: number, text: string) {
    const textSpriteSheetGenerator = TextGenerator.getSpriteSheetGenerator();

    // if uncached, need to update
    const label = LabelGenerator.make(text, this.textStyle);

    label.material.alpha = 0;
    label.position.z = 5;

    // In which page of the spritesheet array can we locate the image?
    const textureIdx = label.spriteSheetIdx ?? -1;

    const [x, y, w, h] = label.textGenerator?._spriteRegionData?.normalizedCoordinates || [0, 0, 1, 1];

    this.mesh.geometry.attributes.uvOffset.setXYZW(idx, x, y, w, h);
    this.mesh.geometry.attributes.uvOffset.needsUpdate = true;

    this.mesh.geometry.attributes.texIdx.setX(idx, textureIdx);
    this.mesh.geometry.attributes.texIdx.needsUpdate = true;

    const { textures, textureCount } = textSpriteSheetGenerator;

    if (textureCount > InstancedIconAttributes.MAX_TEXTURE_ARRAY_SIZE) {
      throw new Error(
        `WebGL: Too many textures; FRAGMENT shader texture image units count exceeds MAX_TEXTURE_IMAGE_UNITS(${InstancedIconAttributes.MAX_TEXTURE_ARRAY_SIZE})`,
      );
    }

    // TODO How to performantly update texture?
    // https://stackoverflow.com/questions/25108574/update-texture-map-in-threejs

    // This should only happen once and is used in case we only
    // have a single spritesheet inside of textSpriteSheetGenerator.
    // Because the numTextures property of this.mesh.material
    // is equal to 1 when the material has been initialized,
    // this clause wouldn't otherwise be run.
    if (
      // Refers to the case above
      !this.hasUpdatedMaterialWithFirstSpritesheet ||
      // Has a page been added?
      textureCount !== this.mesh.material.numTextures
    ) {
      this.mesh.material.map = textures[0];
      this.mesh.material.texArray = textures;
      this.mesh.material.numTextures = textures.length;
      this.mesh.material.needsUpdate = true;
      this.hasUpdatedMaterialWithFirstSpritesheet = true;
    } else {
      const textureToUpdate = this.mesh.material.texArray.slice(-1)[0];

      textureToUpdate.needsUpdate = true;
    }

    // How much do we need to scale the text for it to have
    // the same height regardless of text?
    this.baseScaleLookup.set(idx, [label.width / PLANE_GEOMETRY_WIDTH, label.height / PLANE_GEOMETRY_HEIGHT]);

    this.textLookup.set(idx, text);

    this.setScale(idx, 1);

    // in case we update the text in place and want to
    // retain existing offsets
    if (!this.positionOffsetLookup.has(idx)) {
      this.positionOffsetLookup.set(idx, [0, 0]);
    }
  }

  updateTextConfig(config: Partial<InstancedTextConfiguration>) {
    const { alignment, truncationLength, truncationStrategy, pixelDensity } = config;

    if (alignment) {
      this.alignment = alignment;
    }

    if (truncationLength) {
      this.truncationLength = truncationLength;
    }

    if (truncationStrategy) {
      this.truncationStrategy = truncationStrategy;
    }

    if (pixelDensity) {
      this.pixelDensity = pixelDensity;
    }
  }

  updateTextAt(idx: number, text: string, truncationStrategy?: TruncationStrategy, truncationLength?: number) {
    truncationStrategy = truncationStrategy ?? this.truncationStrategy;

    if (truncationLength) {
      this.truncationLength = truncationLength;
    }

    // TODO This is a bit inefficient...
    // We have to key the string based on how it's truncated.
    // Therefore, we have to re-run the truncation in order to check
    // the cache.
    switch (truncationStrategy) {
      case 'start':
        text = StringUtils.truncateFromEnd(text, this.truncationLength);

        break;
      case 'end':
        text = StringUtils.truncate(text, this.truncationLength);

        break;
      case 'middle':
        text = StringUtils.truncateMiddle(text, this.truncationLength);

        break;
    }

    const previousText = this.textLookup.get(idx);

    // No need to do anything if the incoming text is the same.
    if (previousText === text) return;

    this.registerTextAt(idx, text);
  }

  getOffsets(idx: number) {
    return this.positionOffsetLookup.get(idx) ?? [0, 0];
  }

  setOffsets(idx: number, x: number, y: number) {
    this.positionOffsetLookup.set(idx, [x, y]);
  }

  setScale(idx: number, scalar: number, recurse = true) {
    // if we want to maintain start alignment, we need to also
    // do a position transform in addition to the scaling.
    // This involves resetting to the original position,
    // minus the positional offsets and the scale-centering transform,
    // and then re-positioning so that the new scale-centering transform
    // gets applied.
    if (this.alignment === InstancedTextAlignment.start) {
      let oldScaleX = 1;

      this.mesh.getMatrixAt(idx, this.matrix);
      this.matrix.decompose(this.translation3, this.q, this.s);

      // memoize this.s.x, because super.setScale will overwrite it
      oldScaleX = this.s.x;

      super.setScale(idx, scalar, recurse);

      const [positionOffsetX, positionOffsetY] = this.getOffsets(idx);

      this.setPosition(
        idx,
        this.translation3.x - positionOffsetX - oldScaleX / 2,
        this.translation3.y - positionOffsetY,
        this.translation3.z,
      );
    } else {
      super.setScale(idx, scalar, recurse);
    }
  }

  setPosition(idx: number, x: number, y: number, z: number) {
    const [positionOffsetX, positionOffsetY] = this.getOffsets(idx);

    if (this.alignment === InstancedTextAlignment.start) {
      // do a scale-centering transform here:
      // because the geometry is 1x1, the horizontal scale
      // from the instance matrix will give us the true width
      // of the label. In order to center it, we add half
      // so that it begins at it's pivot point, in the horizontal
      // axis.
      this.mesh.getMatrixAt(idx, this.matrix);
      this.matrix.decompose(this.translation3, this.q, this.s);

      super.setPosition(idx, x + positionOffsetX + this.s.x / 2, y + positionOffsetY, z);
    } else {
      super.setPosition(idx, x + positionOffsetX, y + positionOffsetY, z);
    }
  }

  get name() {
    return `instanced-text-attributes-${this.mesh.uuid.slice(0, 7)}`;
  }
}
