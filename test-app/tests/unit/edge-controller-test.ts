import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { GraphicsV2EdgeController, LineBezier3 } from '@crowdstrike/graphics-core';
import { spy } from 'sinon';

import type { LineBezier3Settings } from '@crowdstrike/graphics-core';

module('Unit | graphics-core | edge-controller', function (hooks) {
  setupTest(hooks);

  let controller: GraphicsV2EdgeController<LineBezier3, LineBezier3Settings>;

  hooks.beforeEach(function () {
    controller = new GraphicsV2EdgeController<LineBezier3, LineBezier3Settings>({
      line: new LineBezier3({}),
    });
  });

  test('receives a LineV2 primitive in the constructor and initializes its settings', async function (assert) {
    assert.ok(controller.line, 'controller stores a line primitive');
    assert.strictEqual(
      controller.state,
      controller.line.settings,
      'controller stores the state of the line',
    );
  });

  test('config diffs and updates', async function (assert) {
    controller.updateConfig({ color: 0x00ff00 });
    assert.strictEqual(controller.state.color, 0x00ff00, 'LineV2.color gets updated correctly');

    controller.updateConfig({ endColor: 0x00ff00 });
    assert.strictEqual(
      controller.state.endColor,
      0x00ff00,
      'LineV2.endColor gets updated corretly',
    );

    controller.updateConfig({ label: 'test label' });
    assert.strictEqual(controller.state.label, 'test label', 'LineV2.label gets updated corretly');

    controller.updateConfig({ labelColor: 0x00ff00 });
    assert.strictEqual(
      controller.state.labelColor,
      0x00ff00,
      'LineV2.labelColor gets updated corretly',
    );

    controller.updateConfig({ startWidth: 2 });
    assert.strictEqual(controller.state.startWidth, 2, 'LineV2.startWidth gets updated corretly');

    controller.updateConfig({ endWidth: 2 });
    assert.strictEqual(controller.state.endWidth, 2, 'LineV2.endWidth gets updated corretly');

    controller.updateConfig({ startArrowPosition: 0.2 });
    assert.strictEqual(
      controller.state.startArrowPosition,
      0.2,
      'LineV2.startArrowPosition gets updated corretly',
    );

    controller.updateConfig({ endArrowPosition: 0.8 });
    assert.strictEqual(
      controller.state.endArrowPosition,
      0.8,
      'LineV2.endArrowPosition gets updated corretly',
    );
  });

  test('disposal', async function (assert) {
    const disposeSpy = spy(controller.line, 'dispose');

    controller.dispose();

    assert.strictEqual(disposeSpy.callCount, 1, 'the line gets disposed');
  });

  test('TODO diffs between current and updated configs properly', async function (assert) {
    assert.ok(true);
  });

  test('exposes the correct line properties', async function (assert) {
    assert.strictEqual(controller.line.start, controller.start, 'exposes line.start');
    assert.strictEqual(controller.line.end, controller.end, 'exposes line.end');
  });

  test('line coplanarity checks', async function (assert) {
    controller.start.set(100, 0, 0);
    controller.end.set(100, 100, 0);

    assert.true(controller.isLineCoplanarOnX());
    assert.false(controller.isLineCoplanarOnY());

    controller.start.set(100, 100, 0);
    controller.end.set(0, 100, 0);

    assert.false(controller.isLineCoplanarOnX());
    assert.true(controller.isLineCoplanarOnY());

    controller.start.set(100, 200, 0);
    controller.end.set(0, 100, 0);

    assert.false(controller.isLineCoplanarOnX());
    assert.false(controller.isLineCoplanarOnY());
  });
});
