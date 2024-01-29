import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import {
  DefaultLineBezier2Settings,
  DefaultLineBezier3Settings,
  DefaultLineV2Settings,
  LineBezier2,
  LineBezier3,
  LineV2,
} from '@crowdstrike/graphics-core';
import { spy } from 'sinon';

module('Unit | graphics-core | LineV2 / Line2Bezier / Line3Bezier', function (hooks) {
  setupTest(hooks);

  let line: LineV2;
  let line2: LineBezier2;
  let line3: LineBezier3;

  hooks.beforeEach(function () {
    line = new LineV2({});
    line2 = new LineBezier2({});
    line3 = new LineBezier3({});
  });

  test('default constructor without any arguments yield default parameters for each class', async function (assert) {
    assert.deepEqual({ ...line.settings }, { ...new DefaultLineV2Settings() }, 'LineV2');
    assert.deepEqual({ ...line2.settings }, { ...new DefaultLineBezier2Settings() }, 'LineBezier2');

    assert.deepEqual({ ...line3.settings }, { ...new DefaultLineBezier3Settings() }, 'LineBezier3');
  });

  test('LineV2.settings reflect initialization parameters of the object', async function (assert) {
    const defaultLine3Parameters = new DefaultLineBezier3Settings();

    Object.keys(defaultLine3Parameters).forEach((key) => {
      assert.deepEqual(
        line3.settings[key as keyof DefaultLineBezier3Settings],
        defaultLine3Parameters[key as keyof DefaultLineBezier3Settings],
        key,
      );
    });
  });

  test('bezier control points are set by default', async function (assert) {
    assert.true(line2.allControlPointsSet, 'line2');
    assert.true(line3.allControlPointsSet, 'line3');
  });

  test('calling update(true) updates the curve', async function (assert) {
    // eslint-disable-next-line
    // @ts-ignore
    const updateCurveSpy = spy(line3, 'updateCurve'); // this is a protected method

    line3.setControlPoint1Offsets(10, 0.1);
    assert.deepEqual(
      updateCurveSpy.callCount,
      0,
      'updateCurve is not called automatically when setting control points',
    );

    line3.update(true);
    assert.deepEqual(
      updateCurveSpy.callCount,
      1,
      'updateCurve is called when update(true) is called',
    );
  });
});
