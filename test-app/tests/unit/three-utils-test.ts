import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { ThreeUtils } from '@crowdstrike/graphics-core';
import { Mesh, MeshBasicMaterial, Object3D, PlaneGeometry } from 'three';

module('Unit | utils | kurst | utils/three-utils', function (hooks) {
  setupTest(hooks);

  test('getVisibleMesh', function (assert) {
    let obj = new Object3D();
    let geom = new PlaneGeometry();
    let mat = new MeshBasicMaterial();
    let mesh = new Mesh(geom, mat);
    let childObj = new Object3D();
    let potentialMesh = ThreeUtils.getVisibleMesh(obj);

    assert.strictEqual(potentialMesh, undefined, 'object has no mesh');

    childObj.add(mesh);
    obj.add(childObj);

    let potentialMesh2 = ThreeUtils.getVisibleMesh(obj);

    assert.strictEqual(potentialMesh2 === mesh, true, 'has returned expected mesh');
  });

  test('getAbsoluteScale', function (assert) {
    let obj = new Object3D();
    let geom = new PlaneGeometry();
    let mat = new MeshBasicMaterial();
    let mesh = new Mesh(geom, mat);
    let childObj = new Object3D();

    childObj.add(mesh);
    obj.add(childObj);

    assert.strictEqual(ThreeUtils.getAbsoluteScale(mesh), 1, 'expected scale');

    childObj.scale.set(0.5, 0.5, 0.5);

    assert.strictEqual(ThreeUtils.getAbsoluteScale(mesh), 0.5, 'expected scale');

    obj.scale.set(0.5, 0.5, 0.5);

    assert.strictEqual(ThreeUtils.getAbsoluteScale(mesh), 0.25, 'expected scale');
  });
});
