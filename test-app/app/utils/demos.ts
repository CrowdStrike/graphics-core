import { MouseControlsPerspective } from 'test-app-for-graphics-core/demos/controls/mouse-controls-perspective';
import { EmberComponentInterfaceTest } from 'test-app-for-graphics-core/demos/core/ember-component-interface-test';
import { LabelGeneratorTest } from 'test-app-for-graphics-core/demos/generators/label-generator-test';
import { ArcLineTest } from 'test-app-for-graphics-core/demos/objects/arc-line-test';
import { ArrowLineMeshTest } from 'test-app-for-graphics-core/demos/objects/arrow-line-mesh-test';

export const DEMO_LIST = [
  {
    DemoClass: MouseControlsPerspective,
    id: 'orthographiccamera-isometric',
    name: 'controls/MouseControls | OrthographicCamera | Isometric',
    settings: {
      isOrthographic: true,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: EmberComponentInterfaceTest,
    id: 'EmberComponentInterfaceTest',
    name: 'core/EmberComponentInterfaceTest',
    settings: { isOrthographic: true },
  },
  {
    DemoClass: LabelGeneratorTest,
    id: 'LabelGeneratorTest',
    name: 'generators/LabelGenerator',
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: ArrowLineMeshTest,
    id: 'ArrowLineMeshTest',
    name: 'objects/ArrowLineMesh - vertex colours (should see red / green / blue line)',
    settings: { isOrthographic: false },
  },
  {
    DemoClass: ArcLineTest,
    id: 'ArcLineTest',
    name: 'objects/ArrowLineMesh-arc',
    settings: { isOrthographic: true },
  },
];
