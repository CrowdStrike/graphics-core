// This shader chunk is used to color the edges of the UV,
// and can be used for debugging purposes.

import * as THREE from 'three';

const debugBoundsVertParams = `
  varying vec2 vBounds;
`;

const debugBoundsVert = `
  vBounds = uv;
`;

const debugBoundsFragParams = `
  varying vec2 vBounds;
`;

const debugBoundsFrag = `
  if(vBounds.x < 0.01 || vBounds.x > 0.99 || vBounds.y < 0.01 || vBounds.y > 0.99) {
    gl_FragColor.x = 1.;
    gl_FragColor.a = 1.;
  }
`;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['debug_bounds_pars_vertex'] = debugBoundsVertParams;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['debug_bounds_vertex'] = debugBoundsVert;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['debug_bounds_pars_fragment'] = debugBoundsFragParams;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['debug_bounds_fragment'] = debugBoundsFrag;
