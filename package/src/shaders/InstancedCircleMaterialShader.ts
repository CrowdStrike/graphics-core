// eslint-disable-next-line import/no-unassigned-import
import './fragments/circle';

export const InstancedCircleVertexShader = `
#include <common>

attribute float instanceOpacity;
varying float vOpacity;

// Used to decide whether to draw the instance or not
attribute float instanceDisplay;
varying float vInstanceDisplay;

attribute vec3 color;
attribute vec3 ringColor;
uniform float ringWidth;
attribute float isHovered;
attribute float isSelected;
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
  vOpacity = instanceOpacity;
  vInstanceDisplay = instanceDisplay;

  #include <begin_vertex>
  #include <project_vertex>
}
`;

export const InstancedCircleFragmentShader = `
#include <common>
varying vec3 vColor;
varying vec2 vMapUv;
varying vec3 vRingColor;
varying float vRingWidth;
varying float vIsHovered;
varying float vIsSelected;
varying float vOpacity;
varying float vInstanceDisplay;

#include <cubic_pulse>
#include <circle_with_ring>

void main() {
  if (vInstanceDisplay < 0.5) discard;
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
