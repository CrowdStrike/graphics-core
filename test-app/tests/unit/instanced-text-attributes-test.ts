import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import {
  InstancedTextAlignment,
  InstancedTextAttributes,
  NumberUtils,
  StringUtils,
  TextGenerator,
} from '@crowdstrike/graphics-core';

module('Unit | graphics-core | instanced-text-attributes', function (hooks) {
  setupTest(hooks);

  let instancedAttributes: InstancedTextAttributes;
  let truncationLength = 10;

  hooks.beforeEach(function () {
    const textSpriteSheetGenerator = TextGenerator.getSpriteSheetGenerator();

    if (!textSpriteSheetGenerator.spriteSheets[0]?.canvas) {
      textSpriteSheetGenerator.requestRegion(2048, 2048);
    }

    instancedAttributes = new InstancedTextAttributes({
      // Text-specific config
      alignment: InstancedTextAlignment.middle,
      truncationLength,
      truncationStrategy: 'end',
      pixelDensity: 3,
      textureAtlas: textSpriteSheetGenerator.currentSpriteSheet.canvas,
    });
  });

  test('updateTextAt respects optional truncation strategy parameter', async function (assert) {
    const textA = NumberUtils.generateUUID();
    const textB = NumberUtils.generateUUID();

    const idxA = instancedAttributes.add({ id: 'A' });

    instancedAttributes.updateTextAt(idxA, textA);

    const idxB = instancedAttributes.add({ id: 'B' });

    instancedAttributes.updateTextAt(idxB, textB, 'middle');

    assert.strictEqual(
      instancedAttributes.textLookup.get(idxA),
      StringUtils.truncate(textA, truncationLength),
      'one instance is truncated at the end',
    );

    assert.strictEqual(
      instancedAttributes.textLookup.get(idxB),
      StringUtils.truncateMiddle(textB, truncationLength),
      'another instance is truncated in the middle',
    );
  });
});
