import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { LabelGenerator,TextStyle, ThreeJSView, ThreeJSViewParams } from '@crowdstrike/graphics-core';
import {spy} from 'sinon';

module('Unit | graphics | core | ThreeJsView', function (hooks) {
  setupTest(hooks);

  test('disposes global assets when there are no views', function (assert) {
    let txtStyle = new TextStyle();

    let label1 = LabelGenerator.make('label1', txtStyle);
    let label2 = LabelGenerator.make('label2', txtStyle);

    let threeJsView1 = new ThreeJSView({ ...new ThreeJSViewParams(), clearColor: 0x000000, shouldUseTrackBall: false, itemsToDispose:[LabelGenerator] });
    let threeJsView2 = new ThreeJSView({ ...new ThreeJSViewParams(), clearColor: 0x000000, shouldUseTrackBall: false, itemsToDispose:[LabelGenerator] });

    let labelDisposeSpy = spy(LabelGenerator, 'dispose');

    threeJsView1.add(label1);
    threeJsView2.add(label2);

    threeJsView1.render();
    threeJsView2.render();

    threeJsView1.dispose();

    assert.strictEqual(labelDisposeSpy.callCount, 0, 'spy has not been called');

    threeJsView2.render(); // this used to throw an error since globals where disposed
    threeJsView2.dispose();

    assert.strictEqual(labelDisposeSpy.callCount, 1, 'has disposed three js view globals');
  });
});
