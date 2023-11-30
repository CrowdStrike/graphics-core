// import { ArrowLineMeshTestMaterial } from '../demos/objects/ArrowLineMeshTestMaterial';
// import { IconGeneratorTest } from '../demos/generators/IconGeneratorTest';
// import { IconographyDemo } from '../demos/generators/IconographyDemo';
import { MouseControlsPerspective } from 'test-app-for-graphics-core/demos/controls/mouse-controls-perspective';
import { MouseControlsTest } from 'test-app-for-graphics-core/demos/controls/mouse-controls-test';
import { EmberComponentInterfaceTest } from 'test-app-for-graphics-core/demos/core/ember-component-interface-test';
import { LabelGeneratorTest } from 'test-app-for-graphics-core/demos/generators/label-generator-test';
import { TextureAtlasLoaderTest } from 'test-app-for-graphics-core/demos/loaders/texture-atlas-loader-test';
import { ArcLineTest } from 'test-app-for-graphics-core/demos/objects/arc-line-test';
import { ArrowLineMeshTest } from 'test-app-for-graphics-core/demos/objects/arrow-line-mesh-test';
import { BarMeshTest } from 'test-app-for-graphics-core/demos/objects/bar-mesh-test';
import { LineMesh2BezierTest } from 'test-app-for-graphics-core/demos/objects/line-mesh-2-bezier-test';
import { LineMesh2Test } from 'test-app-for-graphics-core/demos/objects/line-mesh-2-test';
import { LineMeshBezierTest } from 'test-app-for-graphics-core/demos/objects/line-mesh-bezier-test';
import { ZigZagLineMeshTest } from 'test-app-for-graphics-core/demos/objects/zig-zag-line-mesh-test';
import { PoolTest } from 'test-app-for-graphics-core/demos/pools/pool-test';
import { BitmapPackingDemo } from 'test-app-for-graphics-core/demos/textures/sprite-sheets/bitmap-packing-demo';
import { DynamicSpriteSheetDemo } from 'test-app-for-graphics-core/demos/textures/sprite-sheets/dynamic-sprite-sheet-demo';
import { ColorTweenProxyTest } from 'test-app-for-graphics-core/demos/utils/color-tween-proxy-test';

export const DEMO_LIST = [
  {
    DemoClass: MouseControlsTest,
    id: 'perspectivecamera-top-down',
    name: 'controls/MouseControls | PerspectiveCamera | Top Down',
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: MouseControlsTest,
    id: 'orthographiccamera-top-down',
    name: 'controls/MouseControls | OrthographicCamera | Top Down',
    settings: {
      isOrthographic: true,
      clearColor: 0x555555,
    },
  },
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
    DemoClass: TextureAtlasLoaderTest,
    id: 'TextureAtlasLoader',
    name: 'loaders/TextureAtlasLoader',
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
  {
    DemoClass: BarMeshTest,
    id: 'BarMesh',
    name: 'objects/BarMesh',
    settings: { isOrthographic: false },
  },
  {
    DemoClass: LineMesh2Test,
    id: 'LineMesh2',
    name: 'objects/LinesMesh2',
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: LineMesh2BezierTest,
    id: 'LineMesh2-bezier',
    name: 'objects/LineMesh2-bezier',
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: LineMeshBezierTest,
    id: 'LineMesh-bezier',
    name: 'objects/LineMesh-bezier',
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: ZigZagLineMeshTest,
    id: 'ZigZagLineMesh',
    name: 'objects/ZigZagLineMesh',
    settings: { isOrthographic: false },
  },
  {
    DemoClass: PoolTest,
    id: 'PoolTest',
    name: 'pools/PoolTest',
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: DynamicSpriteSheetDemo,
    id: 'DynamicSpriteSheetDemo',
    name: 'textures/sprite-sheets/DynamicSpriteSheetDemo',
    settings: {
      isOrthographic: false,
      clearColor: 0x00ff00,
    },
  },
  {
    DemoClass: BitmapPackingDemo,
    id: 'BitmapPackingDemo',
    name: 'textures/sprite-sheets/BitmapPackingDemo',
    settings: {
      isOrthographic: false,
      clearColor: 0x000000,
    },
  },
  {
    DemoClass: ColorTweenProxyTest,
    id: 'ColorTweenProxyTest',
    name: 'utils/ColorTweenProxyTest',
    settings: {
      isOrthographic: false,
      clearColor: 0x000000,
    },
  },
];
