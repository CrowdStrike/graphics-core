import { assert as debugAssert } from '@ember/debug';
import { waitUntil } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { InstancedAttributes, NumberUtils } from '@crowdstrike/graphics-core';
import * as THREE from 'three';

import type { EntityWithId } from '@crowdstrike/graphics-core';

module('Unit | graphics-core | instanced-attributes', function (hooks) {
  setupTest(hooks);

  let instanceIds: string[];
  let instancedAttributes: InstancedAttributes;
  let vertices: EntityWithId[];
  let MAX_INSTANCE_COUNT = 10000;
  let attributes = {};

  hooks.beforeEach(function () {
    instanceIds = Array.from(Array(10).keys()).map(() => NumberUtils.generateUUID());
    vertices = instanceIds.map((id) => ({ id }));

    instancedAttributes = new InstancedAttributes<THREE.PlaneGeometry, THREE.MeshBasicMaterial>({
      geometry: new THREE.PlaneGeometry(24, 24, 24),
      material: new THREE.MeshBasicMaterial(),
      count: MAX_INSTANCE_COUNT,
      attributes,
    });

    // children of InstancedAttributes call
    instancedAttributes.pollAttributeTasks();
  });

  test('adds and removes instances', async function (assert) {
    const INSTANCES_TO_ADD = 4;
    const INSTANCES_TO_REMOVE = 1;

    const verticesToAdd = vertices.slice(0, INSTANCES_TO_ADD);
    const verticesToRemove = vertices.slice(0, INSTANCES_TO_REMOVE);

    const idsToAdd = instanceIds.slice(0, INSTANCES_TO_ADD);
    const idsToRemove = idsToAdd.slice(0, INSTANCES_TO_REMOVE);

    verticesToAdd.forEach((vertex) => {
      instancedAttributes.add(vertex);
    });

    assert.strictEqual(
      instancedAttributes.size,
      INSTANCES_TO_ADD,
      'InstancedAttribute dictionary contains the right amount of ID entries after insertion'
    );

    await waitUntil(() => noPendingTasks(instancedAttributes)).then(() => {
      assert.strictEqual(
        instancedAttributes.mesh.geometry.attributes['instanceDisplay']?.getX(0),
        1,
        'instanceDisplay attribute array updates after instance insertion'
      );
    });

    verticesToRemove.forEach((vertex) => {
      instancedAttributes.remove(vertex);
    });

    await waitUntil(() => noPendingTasks(instancedAttributes)).then(() => {
      assert.strictEqual(
        instancedAttributes.mesh.geometry.attributes['instanceDisplay']?.getX(0),
        0,
        'instanceDisplay attribute array updates after instance deletion'
      );
    });

    assert.strictEqual(
      instancedAttributes.size,
      INSTANCES_TO_ADD - INSTANCES_TO_REMOVE,
      'InstancedAttribute dictionary contains the right amount of ID entries after deletion'
    );

    verticesToRemove.forEach((vertex) => {
      assert.throws(() => {
        instancedAttributes.remove(vertex);
      }, 'Deleting a non-existent vertex throws an Error');
    });

    assert.strictEqual(
      instancedAttributes.size,
      INSTANCES_TO_ADD - INSTANCES_TO_REMOVE,
      "Deleting a non-existent ID doesn't change the number of entries"
    );

    // add a previously non-existent ID – which index will it be added in?
    const [idToAdd] = instanceIds.slice(-1);

    debugAssert('id may not be falsey', idToAdd);

    let vertex2 = { id: idToAdd };

    instancedAttributes.add(vertex2);

    assert.strictEqual(
      instancedAttributes.dataForId(idToAdd),
      0,
      'New instance will move to most recently removed index'
    );

    debugAssert('id may not be falsey', idsToRemove[0]);

    let vertex1 = { id: idsToRemove[0] };

    instancedAttributes.add(vertex1);

    assert.strictEqual(
      instancedAttributes.dataForId(vertex1.id),
      instancedAttributes.size - 1,
      'Previously removed instance will move to new index'
    );
  });

  test('accessing attributes', async function (assert) {
    assert.strictEqual(
      instancedAttributes.attributes,
      attributes,
      'InstancedAttributes.attributes object gets set correctly'
    );

    assert.strictEqual(
      instancedAttributes.mesh.geometry.attributes['instanceDisplay']?.array.length,
      MAX_INSTANCE_COUNT,
      'instanceDisplay attribute array gets correctly added to mesh geometry'
    );
  });

  test('adding many instances', async function (assert) {
    assert.strictEqual(
      instancedAttributes.maxInstanceCount,
      MAX_INSTANCE_COUNT,
      'InstancedAttributes.maxInstanceCount gets set correctly'
    );

    assert.throws(() => {
      const verticesToAdd: EntityWithId[] = Array.from(Array(MAX_INSTANCE_COUNT + 1).keys()).map(
        () => ({ id: NumberUtils.generateUUID() })
      );

      verticesToAdd.forEach((vertex) => {
        instancedAttributes.add(vertex);
      });
    }, 'adding too many instances throws an error');
  });

  test('disposing', async function (assert) {
    assert.expect(0);
    instancedAttributes.dispose();
  });
});

function noPendingTasks(i: InstancedAttributes) {
  return i.attributeTasks.length === 0;
}
