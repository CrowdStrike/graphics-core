// eslint-disable-next-line import/no-unassigned-import
import './fragments/circle';

export const CircleVertexShader = `
#include <common>
uniform vec3 color;
uniform vec3 ringColor;
uniform float ringWidth;
uniform vec2 resolution;
uniform float isHovered;
uniform float isSelected;
varying vec3 vColor;
varying float vIsHovered;
varying float vIsSelected;
varying vec3 vRingColor;
varying float vRingWidth;
varying vec2 vMapUv;

void main() {
  vColor = color;
  vMapUv = uv;
  vRingColor = ringColor;
  vRingWidth = ringWidth;
  vIsHovered = isHovered;
  vIsSelected = isSelected;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const CircleFragmentShader = `
#include <common>
varying vec3 vColor;
varying vec2 vMapUv;
varying vec3 vRingColor;
varying float vRingWidth;
varying float vIsHovered;
varying float vIsSelected;

#include <cubic_pulse>
#include <circle_with_ring>

void main() {
  vec2 center = vec2(0.5); // the center of the circle
  float d = distance(vMapUv, center); // radial distance

  if (d > .48 - (2. * vRingWidth * (1. - vIsSelected))) {
    // make .48 to discard the jagged edges of the circle geometry we use
    // this is more prominent on light background
    discard;
  }

  vec4 c = circleWithRing(d);
  gl_FragColor = c;
}
`;
