import * as THREE from 'three';

const instancedDisplayAttributesVertParams = `
  attribute vec3 instanceColor;
  varying vec3 vColor;

  attribute float instanceOpacity;
  varying float vOpacity;

  // Used to decide whether to draw the instance or not
  attribute float instanceDisplay;
  varying float vDisplay;
`;

const instancedDisplayAttributesVert = `
  vColor = instanceColor;
  vOpacity = instanceOpacity;
  vDisplay = instanceDisplay;
`;

const instancedDisplayAttributesFragParams = `
  varying vec3 vColor;
  varying float vOpacity;
  varying float vDisplay;
`;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['instanced_display_attributes_pars_vertex'] =
  instancedDisplayAttributesVertParams;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['instanced_display_attributes_vertex'] = instancedDisplayAttributesVert;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['instanced_display_attributes_pars_fragment'] =
  instancedDisplayAttributesFragParams;
