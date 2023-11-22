import { render, waitUntil } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { spy } from 'sinon';
import { generateIconGridWithOverlays } from 'test-app-for-graphics-core/utils/entities';

import type { InstancedIconAttributes, InstancedTextAttributes } from '@crowdstrike/graphics-core';

module('Integration | graphics-core | instanced-icon-attributes', async function (hooks) {
  setupRenderingTest(hooks);

  let icons: InstancedIconAttributes;
  let labels: InstancedTextAttributes;
  let descriptions: InstancedIconAttributes;
  let badges: InstancedIconAttributes;

  hooks.beforeEach(async function () {
    await render(hbs`
    <div data-test-selector="three-canvas"></div>
    `);

    const element = document.querySelector<HTMLElement>(
      `[data-test-selector="three-canvas"]`,
    ) as HTMLElement;

    if (element === undefined) {
      throw new Error("Couldn't render a canvas");
    }

    const ICONS_TO_RENDER = 10;

    const { baseIconAttributes, labelsAttributes, descriptionsAttributes, badgesAttributes } =
      await generateIconGridWithOverlays(ICONS_TO_RENDER);

    icons = baseIconAttributes;
    labels = labelsAttributes;
    descriptions = descriptionsAttributes;
    badges = badgesAttributes;

    await waitUntil(
      () => {
        return icons.idDict.size === ICONS_TO_RENDER;
      },
      { timeout: 1000 },
    );
  });

  test('this is a sample test', async function (assert) {
    assert.ok(true);
  });

  test('instanced-text-attributes.remove should run delete the corresponsing entry inside textLookup', async function (assert) {
    const keyToRemove = [...labels.idDict.keys()][0];

    if (!keyToRemove) {
      throw new Error("Key couldn't be found");
    }

    icons.remove({ id: keyToRemove });

    assert.false(labels.textLookup.has(0), "vertex's instance index is removed from textLookup");
  });
  test('instanced-icon-attributes should run the dispose method on all UI overlays', async function (assert) {
    const iconsSpy = spy(icons, 'dispose');
    const labelsSpy = spy(labels, 'dispose');
    const descriptionsSpy = spy(descriptions, 'dispose');
    const badgesSpy = spy(badges, 'dispose');

    icons.dispose();

    assert.deepEqual(iconsSpy.callCount, 1);
    assert.deepEqual(labelsSpy.callCount, 1);
    assert.deepEqual(descriptionsSpy.callCount, 1);
    assert.deepEqual(badgesSpy.callCount, 1);
  });
});
