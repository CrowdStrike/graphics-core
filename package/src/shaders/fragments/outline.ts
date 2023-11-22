import * as THREE from 'three';

const outlineVertParams = `
  // used for borders
  uniform float borderOffset;
  mat3 insetMatrix;
  varying vec2 vUvOutsideSample;

  vec2 scaleVec2(vec2 v, float factor) {
    // 1 - factor < 0 will scale down the vector
    mat3 scaleMatrix = mat3(
      // first column
      1. - factor, 0.0, 0.0,
      // second column
      0.0, 1. - factor, 0.0,
      // third column
      0.0, 0.0, 1.0
    );

    // scale and center around origin -> v ∈ [-0.5, 0.5]
    vec2 scaled = (scaleMatrix * vec3(v.x - 0.5, v.y - 0.5, 1.0)).xy;

    // reset translation -> v ∈ [0, 1]
    scaled += 0.5;

    return scaled;
  }
`;

const outlineVert = `
  // reference: https://ncase.me/matrix/
  mat3 insetMatrix = mat3(
    // first column
    1. - borderOffset, 0.0, 0.0,
    // second column
    0.0, 1. - borderOffset, 0.0,
    // third column
    0.0, 0.0, 1.0
  );

  // a scaled up UV sampling box will scale down the resulting sampled image
  vec2 scaledUpSamplingRegion = scaleVec2(uv, -borderOffset/2.);

  // a scaled down UV sampling box will scale up the resulting sampled image
  vec2 scaledDownSamplingRegion = scaleVec2(uv, borderOffset/2.);

  // absolute texture coordinates from the texture atlas
  vMapUv = (mapTransform * vec3(uvOffset.xy, 1.)).xy + scaledUpSamplingRegion * uvOffset.zw;
  vUvOutsideSample = (mapTransform * vec3(uvOffset.xy, 1.)).xy + scaledDownSamplingRegion * uvOffset.zw;
`;

const outlineFragParams = `
  uniform vec3 borderColor;
  varying vec2 vUvOutsideSample;
`;

const outlineFrag = `
  vec4 insideColor = vec4(
    vColor,
    vOpacity *  texture2D(map, vMapUv).a
  );

  vec4 outsideColor = vec4(
    borderColor.xyz,
    vOpacity * texture2D(map, vUvOutsideSample).a
  );

  if (outsideColor.a > .0 && insideColor.a < 0.1) {
    gl_FragColor = outsideColor;
  } else {
    gl_FragColor = insideColor;
  }

  gl_FragColor.a = outsideColor.a + insideColor.a;
`;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['outline_pars_vertex'] = outlineVertParams;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['outline_vertex'] = outlineVert;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['outline_pars_fragment'] = outlineFragParams;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['outline_fragment'] = outlineFrag;
