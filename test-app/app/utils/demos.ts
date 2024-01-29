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

export const DEMO_TAGS = {
  CAMERA: 'camera',
  CUSTOM_GLSL: 'custom GLSL',
  EMBER: 'ember',
  INSTANCED_RENDERING: 'instanced-rendering',
  PRIMITIVE: 'primitive',
  SPRITESHEET: 'spritesheet',
  TEXTURE_SAMPLING: 'texture sampling',
};

export const DEMO_LIST = [
  {
    DemoClass: MouseControlsTest,
    route: 'demo-viewer',
    id: 'perspectivecamera-top-down',
    name: 'MouseControls (perspective / top down)',
    description: 'Using MouseControls and ThreeJSView to detect presence of objects in the scene',
    tags: [DEMO_TAGS.CAMERA, DEMO_TAGS.SPRITESHEET],
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: MouseControlsTest,
    route: 'demo-viewer',
    id: 'orthographiccamera-top-down',
    name: 'MouseControls (orthographic / top down)',
    description: 'Using MouseControls and ThreeJSView to detect presence of objects in the scene',
    tags: [DEMO_TAGS.CAMERA, DEMO_TAGS.SPRITESHEET],
    settings: {
      isOrthographic: true,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: MouseControlsPerspective,
    route: 'demo-viewer',
    id: 'orthographiccamera-isometric',
    name: 'MouseControls (isometric)',
    description: 'Using MouseControls and ThreeJSView to detect presence of objects in the scene',
    tags: [DEMO_TAGS.CAMERA, DEMO_TAGS.PRIMITIVE],
    settings: {
      isOrthographic: true,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: EmberComponentInterfaceTest,
    route: 'demo-viewer',
    id: 'EmberComponentInterfaceTest',
    name: 'EmberComponentInterface',
    description: 'Extending ThreeJsComponentInterface to use ThreeJSView with Ember.js',
    tags: [DEMO_TAGS.EMBER, DEMO_TAGS.PRIMITIVE],
    settings: { isOrthographic: true },
  },
  {
    DemoClass: LabelGeneratorTest,
    route: 'demo-viewer',
    id: 'LabelGeneratorTest',
    name: 'generators/LabelGenerator',
    description:
      'An example of rendering of using LabelGenerator to render text to an offscreen canvas',
    tags: [DEMO_TAGS.SPRITESHEET],
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: TextureAtlasLoaderTest,
    route: 'demo-viewer',
    id: 'TextureAtlasLoader',
    name: 'loaders/TextureAtlasLoader',
    description: 'Loading a texture atlas, sampling, and rendering icons as sprites',
    tags: [DEMO_TAGS.SPRITESHEET, DEMO_TAGS.TEXTURE_SAMPLING],
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: ArrowLineMeshTest,
    route: 'demo-viewer',
    id: 'ArrowLineMeshTest',
    name: 'objects/ArrowLineMesh - vertex colours (should see red / green / blue line)',
    description: 'An implementation of a straight line with arrows and text',
    tags: [DEMO_TAGS.PRIMITIVE],
    settings: { isOrthographic: false },
  },
  {
    DemoClass: ArcLineTest,
    route: 'demo-viewer',
    id: 'ArcLineTest',
    name: 'objects/ArrowLineMesh-arc',
    description: 'An implementation of a curved line',
    tags: [DEMO_TAGS.PRIMITIVE],
    settings: { isOrthographic: true },
  },
  {
    DemoClass: BarMeshTest,
    route: 'demo-viewer',
    id: 'BarMesh',
    name: 'objects/BarMesh',
    description: 'An example of a line using BarMesh',
    tags: [DEMO_TAGS.PRIMITIVE],
    settings: { isOrthographic: false },
  },
  {
    DemoClass: LineMesh2Test,
    route: 'demo-viewer',
    id: 'LineMesh2',
    name: 'objects/LinesMesh2',
    description: 'Variable-width line using LinesMesh2',
    tags: [DEMO_TAGS.PRIMITIVE],
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: LineMesh2BezierTest,
    route: 'demo-viewer',
    id: 'LineMesh2-bezier',
    name: 'objects/LineMesh2-bezier',
    description: 'Variable-width bezier lines with control points',
    tags: [DEMO_TAGS.PRIMITIVE],
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: LineMeshBezierTest,
    route: 'demo-viewer',
    id: 'LineMesh-bezier',
    name: 'objects/LineMesh-bezier',
    description: 'Single-width bezier lines with control points',
    tags: [DEMO_TAGS.PRIMITIVE],
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: ZigZagLineMeshTest,
    route: 'demo-viewer',
    id: 'ZigZagLineMesh',
    name: 'objects/ZigZagLineMesh',
    description:
      'ZigZagLineMesh is used to debug lines by writing line positions to the vertex array buffer',
    tags: [DEMO_TAGS.PRIMITIVE],
    settings: { isOrthographic: false },
  },
  {
    DemoClass: PoolTest,
    route: 'demo-viewer',
    id: 'PoolTest',
    name: 'pools/PoolTest',
    description: 'Load a texture atlas and add icons to an object pool',
    tags: [DEMO_TAGS.SPRITESHEET, DEMO_TAGS.TEXTURE_SAMPLING],
    settings: {
      isOrthographic: false,
      clearColor: 0x555555,
    },
  },
  {
    DemoClass: DynamicSpriteSheetDemo,
    route: 'demo-viewer',
    id: 'DynamicSpriteSheetDemo',
    name: 'textures/sprite-sheets/DynamicSpriteSheetDemo',
    description:
      'DynamicSpriteSheetGenerator packs a spritesheet and renders strings to an offscreen canvas',
    tags: [DEMO_TAGS.SPRITESHEET, DEMO_TAGS.TEXTURE_SAMPLING],
    settings: {
      isOrthographic: false,
      clearColor: 0x00ff00,
    },
  },
  {
    DemoClass: BitmapPackingDemo,
    route: 'demo-viewer',
    id: 'BitmapPackingDemo',
    name: 'textures/sprite-sheets/BitmapPackingDemo',
    description: 'Pack variable size bitmaps into a spritesheet',
    tags: [DEMO_TAGS.SPRITESHEET, DEMO_TAGS.TEXTURE_SAMPLING],
    settings: {
      isOrthographic: false,
      clearColor: 0x000000,
    },
  },
  {
    DemoClass: ColorTweenProxyTest,
    route: 'demo-viewer',
    id: 'ColorTweenProxyTest',
    name: 'utils/ColorTweenProxyTest',
    description: 'Transitions the color of a line as it moves through color space',
    tags: [DEMO_TAGS.PRIMITIVE],
    settings: {
      isOrthographic: false,
      clearColor: 0x000000,
    },
  },
  {
    route: 'vertex-playground',
    name: 'Vertex Playground',
    description:
      'A controller that enables the instanced rendering of multiple layers of UI. This can be useful for rendering information-rich vertices on a graph',
    tags: [DEMO_TAGS.INSTANCED_RENDERING, DEMO_TAGS.TEXTURE_SAMPLING],
  },
  {
    route: 'instanced-attributes',
    name: 'Instanced Attributes',
    description:
      'InstancedAttributes and its children allow for efficiently rendered and sampling from a paged spritesheet',
    tags: [DEMO_TAGS.INSTANCED_RENDERING, DEMO_TAGS.TEXTURE_SAMPLING],
  },
  {
    route: 'label-generator',
    name: 'InstancedMultiUvMaterial for Paged Texture Sampling',
    description:
      'Demonstrates the use of InstancedMultiUvMaterial to sample from an array of textures',
    tags: [DEMO_TAGS.CUSTOM_GLSL, DEMO_TAGS.INSTANCED_RENDERING, DEMO_TAGS.TEXTURE_SAMPLING],
  },
  {
    route: 'multi-texture-shader',
    name: 'Multi-Texture Shader',
    description:
      'Render 1M instances of the same VideoTexture sampled across different regions in each instance',
    tags: [DEMO_TAGS.CUSTOM_GLSL, DEMO_TAGS.INSTANCED_RENDERING, DEMO_TAGS.TEXTURE_SAMPLING],
  },
  {
    route: 'edges-v2',
    name: 'three/examples/jsm/lines/Line2',
    description: 'A demo that uses three/examples/jsm/lines/Line2',
    tags: [DEMO_TAGS.PRIMITIVE],
  },
  {
    route: 'edge-types',
    name: 'LineV2 Primitive',
    description:
      'A customizable line for rendering straight lines, cubic, or quadratic bezier curves. Includes options for color gradients, dash offsets, labels, modulated line width, and more',
    tags: [DEMO_TAGS.CUSTOM_GLSL, DEMO_TAGS.PRIMITIVE],
  },
  {
    route: 'entity-types',
    name: 'Entity Types',
    description:
      'A demo illustrating how to handle coplanarity of multiple lines for the lines above',
    tags: [DEMO_TAGS.PRIMITIVE],
  },
];

export type DemoType = (typeof DEMO_LIST)[number];
