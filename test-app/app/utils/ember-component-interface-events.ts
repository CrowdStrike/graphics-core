import { Event } from '@crowdstrike/graphics-core';
import * as THREE from 'three';

import type { MousePickerEvents } from '@crowdstrike/graphics-core';

export class EmberComponentInterfaceEvents extends Event {
  static ROLL_OVER = 'EmberComponentInterfaceEvents_ROLL_OVER';
  static ROLL_OUT = 'EmberComponentInterfaceEvents_ROLL_OUT';
  static MOUSE_DOWN = 'EmberComponentInterfaceEvents_MOUSE_DOWN';
  static DOUBLE_CLICK = 'EmberComponentInterfaceEvents_DOUBLE_CLICK';
  static GRAPH_VIEW_ACTION = 'EmberComponentInterfaceEvents_GRAPH_VIEW_ACTION';
  static GRAPH_VIEW_ENTER = 'EmberComponentInterfaceEvents_GRAPH_VIEW_ENTER';
  static GRAPH_VIEW_SUSPENDED = 'EmberComponentInterfaceEvents_GRAPH_VIEW_SUSPENDED';
  static ENTITIES_ADDED = 'EmberComponentInterfaceEvents_ADDED_ENTITY';

  graphItems?: unknown[];
  graphItemData?: unknown;
  data?: unknown;
  dataType?: unknown;
  id?: string;
  mesh?: THREE.Mesh;
  point = new THREE.Vector2();
  mousePickerEvent?: MousePickerEvents;
  height?: number;

  constructor(type: string) {
    super(type);
    this.data = undefined;
    this.dataType = undefined;
    this.id = undefined;
    this.mesh = undefined;
    this.point = new THREE.Vector2();
  }

  reset() {
    super.reset();
    this.data = undefined;
    this.dataType = undefined;
    this.id = undefined;
    this.mesh = undefined;
    this.point = new THREE.Vector2();
  }

  clone() {
    let e = new EmberComponentInterfaceEvents(this.type);

    e.graphItemData = this.graphItemData;
    e.data = this.data;
    e.dataType = this.dataType;
    e.id = this.id;
    e.mesh = this.mesh;
    e.point.x = this.point.x;
    e.point.y = this.point.y;
    e.height = this.height;

    return e;
  }
}
