import {
  GL_MAX_TEXTURE_IMAGE_UNITS,
  InstancedIconAttributes,
  InstancedInteractionAttributes,
  InstancedTextAlignment,
  InstancedTextAttributes,
  NumberUtils,
  TextGenerator,
  TextStyle,
} from '@crowdstrike/graphics-core';
import IconTextureAtlas from 'test-app-for-graphics-core/assets/icon-texture-atlas.png';
import iconCoordinates from 'test-app-for-graphics-core/utils/coordinates';
import * as THREE from 'three';

type LabelMap = Map<
  string,
  {
    text: string;
  }
>;

let ALL_ICONS_COUNT = Object.entries(iconCoordinates).length;
const textSpriteSheetGenerator = TextGenerator.getSpriteSheetGenerator();

export const generateIconGridWithOverlays = async (numIconsToRender = ALL_ICONS_COUNT) => {
  if (!textSpriteSheetGenerator.spriteSheets[0]?.canvas) {
    textSpriteSheetGenerator.requestRegion(2048, 2048);
  }

  const style = new TextStyle();

  style.name = 'style-name';
  style.fontSize = 12;
  style.pixelDensity = 2;
  style.alignment = TextStyle.ALIGN_CENTER;
  style.fontName = 'Helvetica Neue';

  const loader = new THREE.TextureLoader();
  const iconTextureAtlas: THREE.Texture = await new Promise((resolve) => {
    loader.load(IconTextureAtlas, (d) => {
      resolve(d);
    });
  });

  const baseIconAttributes = new InstancedIconAttributes({
    maxTextureArraySize: GL_MAX_TEXTURE_IMAGE_UNITS,
    textureAtlas: iconTextureAtlas,
  });

  baseIconAttributes.uiLayers.set(
    'badge',
    new InstancedIconAttributes(
      {
        textureAtlas: iconTextureAtlas,
      },
      {
        name: 'badge',
        offset: {
          x: 12,
          y: 12,
        },
        scale: 0.5,
      },
    ),
  );

  baseIconAttributes.uiLayers.set(
    'label',
    new InstancedTextAttributes(
      {
        textureAtlas: textSpriteSheetGenerator.spriteSheets[0]?.canvas,
        // Text-specific config
        alignment: InstancedTextAlignment.start,
        truncationLength: 15,
        truncationStrategy: 'middle',
        pixelDensity: 3,
      },
      {
        name: 'label',
        offset: {
          x: 0,
          y: 0,
        },
        scale: 1,
      },
    ),
  );

  baseIconAttributes.uiLayers.set(
    'description',
    new InstancedTextAttributes(
      {
        textureAtlas: textSpriteSheetGenerator.spriteSheets[0]?.canvas,
        // Text-specific config
        alignment: InstancedTextAlignment.start,
        truncationLength: 35,
        truncationStrategy: 'end',
        pixelDensity: 3,
      },
      {
        name: 'description',
        offset: {
          x: 0,
          y: 0,
        },
        scale: 1,
      },
    ),
  );

  baseIconAttributes.uiLayers.set(
    'interaction-plane',
    new InstancedInteractionAttributes(
      { size: 24 },
      {
        name: 'interaction-plane',
        offset: {
          x: 0,
          y: 0,
        },
        scale: 1,
      },
    ),
  );

  baseIconAttributes.uiLayersAreRegistered = true;

  const badgesAttributes = baseIconAttributes.getUiLayer<InstancedTextAttributes>('badge');

  const descriptionsAttributes =
    baseIconAttributes.getUiLayer<InstancedTextAttributes>('description');

  const interactionsAttributes =
    baseIconAttributes.getUiLayer<InstancedInteractionAttributes>('interaction-plane');

  const labelsAttributes = baseIconAttributes.getUiLayer<InstancedTextAttributes>('label');

  labelsAttributes.registerTextStyle(style);
  descriptionsAttributes.registerTextStyle(style);

  for (let [id, { x, y, w, h, width, height }] of Object.entries(iconCoordinates).slice(
    0,
    numIconsToRender,
  )) {
    const idx = baseIconAttributes.add({ id });
    const posX = ~~(idx / 20) * 200;
    const posY = (idx % 20) * 200;
    const posZ = 10;

    badgesAttributes.add({ id });
    baseIconAttributes.changeIcon(idx, width, height, [x, y, w, h]);

    badgesAttributes.changeIcon(idx, width, height, [x, y, w, h]);
    badgesAttributes.setIconColor(idx, 0xffffff);

    descriptionsAttributes.add({ id });
    labelsAttributes?.add({ id });

    labelsAttributes.updateTextAt(idx, id);
    labelsAttributes.setScale(idx, 12);
    labelsAttributes.setOffsets(idx, 0, -height / 2 - 15);
    labelsAttributes.setIconColor(idx, 0xffffff);

    descriptionsAttributes.updateTextAt(idx, id);
    descriptionsAttributes.setScale(idx, 8);
    descriptionsAttributes.setOffsets(idx, 0, -height / 2 - 25);
    descriptionsAttributes.setIconColor(idx, 0xffffff);

    interactionsAttributes.add({ id });
    interactionsAttributes.setHoverAt(idx, false);
    interactionsAttributes.setSelectAt(idx, false);
    interactionsAttributes.setDisplayAt(idx, false);
    interactionsAttributes.setColorAt(idx, 0xff0000);
    interactionsAttributes.setRingColorAt(idx, 0x00ffff);

    baseIconAttributes.setPosition(idx, posX, posY, posZ);

    // this is needed in order to recursively scale ui layers
    // such as the badge
    baseIconAttributes.setScale(idx, Math.min(width, height), true);

    // override for interactionsAttributes
    interactionsAttributes.setScale(idx, 42);
  }

  // Translate to center of viewport
  const { max: iconsMax } = baseIconAttributes.dimensions;

  baseIconAttributes.translate(-iconsMax.x / 2, -iconsMax.y / 2);

  return {
    baseIconAttributes,
    labelsAttributes,
    descriptionsAttributes,
    badgesAttributes,
    interactionsAttributes,
  };
};

export const generateTextGrid = (STRINGS_TO_RENDER = 200) => {
  if (!textSpriteSheetGenerator.spriteSheets[0]?.canvas) {
    textSpriteSheetGenerator.requestRegion(2048, 2048);
  }

  let style = new TextStyle();
  const labelMap: LabelMap = new Map();
  const generatedStrings: string[] = [];

  style.name = 'style-name';
  style.fontSize = 12;
  style.pixelDensity = 2;
  style.alignment = TextStyle.ALIGN_CENTER;
  style.fontName = 'Helvetica Neue';

  for (let i = 0; i < STRINGS_TO_RENDER; i++) {
    // const t = textSpriteSheetGenerator.spriteSheets.length - 1 + '-' + NumberUtils.generateUUID();
    let t = NumberUtils.generateUUID().substring(0, NumberUtils.getRandomInt(1, 17));

    generatedStrings.push(t);

    labelMap.set(t, {
      text: t,
    });
  }

  const instancedTextAttributes = new InstancedTextAttributes({
    textureAtlas: textSpriteSheetGenerator.spriteSheets[0]?.canvas,
    truncationLength: 10,
    pixelDensity: 4,
  });

  instancedTextAttributes.registerTextStyle(style);

  let idx = 0;

  for (let id of labelMap.keys()) {
    if (Math.random() > 0.8) {
      style.fontName = 'georgia';
    } else {
      style.fontName = 'sans-serif';
    }

    instancedTextAttributes.registerTextStyle(style);
    instancedTextAttributes.add({ id });
    instancedTextAttributes.updateTextAt(idx, id);
    instancedTextAttributes.setPosition(idx, ~~(idx / 100) * 120, (idx % 100) * 20, 10);
    idx++;
  }

  // Translate to center of viewport
  const { max: textsMax } = instancedTextAttributes.dimensions;

  instancedTextAttributes.translate(-textsMax.x / 2, -textsMax.y / 2);

  return { instancedTextAttributes, labelMap };
};
