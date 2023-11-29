import { waitUntil } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import {
  generateDefaultUiSlots,
  GraphicsV2VertexController,
  InstancedIconAttributes,
  TextStyle,
} from '@crowdstrike/graphics-core';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import IconTextureAtlas from 'test-app-for-graphics-core/assets/icon-texture-atlas.png';
import iconCoordinates from 'test-app-for-graphics-core/utils/coordinates';
import * as THREE from 'three';

import type { OverlayContent } from '@crowdstrike/graphics-core';

module('Unit | graphics-core | vertex-controller', function (hooks) {
  setupTest(hooks);

  const loader = new THREE.TextureLoader();
  let iconTextureAtlas: THREE.Texture;
  let sharedIconAttributesForVertices: InstancedIconAttributes;
  let baseIcon = 'graph-entities/node-24-pressed' as keyof typeof iconCoordinates;
  let entity: GraphicsV2VertexController;
  const entityId = '';
  let slots = generateDefaultUiSlots();
  const overlayContent: OverlayContent = {
    label: [
      {
        text: baseIcon ?? 'label',
        color: 0x00ff00,
      },
    ],
    description: [
      {
        text: `test_description`,
        color: 0x00ff00,
        isVisible: false,
      },
    ],
    interaction_plane: [
      {
        color: 0x444444,
        ringColor: 0xdddddd,
      },
    ],
  };

  hooks.before(async function () {
    iconTextureAtlas = await new Promise((resolve) => {
      loader.load(IconTextureAtlas, (d) => {
        resolve(d);
      });
    });

    await waitUntil(() => iconTextureAtlas !== undefined);

    sharedIconAttributesForVertices = new InstancedIconAttributes({
      maxTextureArraySize: 2,
      textureAtlas: iconTextureAtlas,
    });

    if (!baseIcon) throw new Error('error finding icon in iconCoordinates');

    entity = new GraphicsV2VertexController({
      id: entityId,
      size: 24,
      icon: baseIcon,
      color: 0xffffff,
      overlays: overlayContent,
      slots,
      iconCoordinates,
      iconAttributes: sharedIconAttributesForVertices,
      textStyle: new TextStyle(),
    });
  });

  test('entity is created', function (assert) {
    assert.ok(entity, 'vertex entity was created');
  });

  test('slot configuration yields the correct attributes', function (assert) {
    slots.forEach(({ name, locations }) => {
      const numLocations = locations.length;

      if (!entity.uiLayerSlotMap.has(name))
        throw new Error('vertex-controller-test: defined slot layer not found');

      assert.ok(entity.uiLayerSlotMap.has(name), `${name} slot exists`);
      assert.equal(
        entity.uiLayerSlotMap.get(name)?.length,
        numLocations,
        `${name} slot has the appropriate number of locations (${numLocations})`,
      );

      for (let idx = 0; idx < numLocations; idx++) {
        const attributeName = GraphicsV2VertexController.getLayerSlotName(name, idx);

        assert.ok(
          entity.getUiLayer(attributeName),
          `${attributeName} attributes have been instantiated`,
        );

        assert.ok(
          entity.uiAttributeMap.has(attributeName),
          `${attributeName} is contained in entity.uiAttributeMap`,
        );

        assert.ok(
          entity.uiAttributeMap.get(attributeName)?.idDict.has(entityId),
          `${attributeName} contains the entity's ID`,
        );
      }
    });

    assert.deepEqual(overlayContent, entity.overlayContent, 'overlay content is correct');
  });

  test('UV offsets of base icon are correctly set', function (assert) {
    if (!baseIcon) return;

    let { x, y, w, h } = iconCoordinates[baseIcon];

    assert.ok(
      entity.iconAttributes.attributes['uvOffset']?.getX(0) === x &&
        entity.iconAttributes.attributes['uvOffset']?.getY(0) === y &&
        entity.iconAttributes.attributes['uvOffset']?.getZ(0) === w &&
        entity.iconAttributes.attributes['uvOffset']?.getW(0) === h,
      'entity.iconCoordinates: setting the base icon sends the correct UV offsets to the uvOffset attributes',
    );

    entity.updateState({ icon: 'micro/hexagon-10' });

    let newIconCoordinates = iconCoordinates['micro/hexagon-10'];

    assert.ok(
      entity.iconAttributes.attributes['uvOffset']?.getX(0) === newIconCoordinates.x &&
        entity.iconAttributes.attributes['uvOffset']?.getY(0) === newIconCoordinates.y &&
        entity.iconAttributes.attributes['uvOffset']?.getZ(0) === newIconCoordinates.w &&
        entity.iconAttributes.attributes['uvOffset']?.getW(0) === newIconCoordinates.h,
      'entity.iconCoordinates: setting the base icon sends the correct UV offsets to the uvOffset attributes',
    );
  });

  test('TODO adding slots to configuration mid-flight', function (assert) {
    assert.ok(true)
  });
});
