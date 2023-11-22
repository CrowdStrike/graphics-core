/**
 * This is a slightly modified version of the LineMaterial which
 * comes in the examples folder of THREE.js.
 *
 * It was created in this way because the changes made were enough
 * that a a search and replace on the shaders wouldn't suffice.
 *
 * It adds the following:
 *  - options for color gradients;
 *  - visibility offset uniforms which allows for animating the lines;
 *  - tapered lines (only supported on lines with more than 1 line segment)
 */
import * as THREE from 'three';

const lineGradientUniforms = {
  worldUnits: { value: 1 },
  linewidth: { value: 1 },
  resolution: { value: new THREE.Vector2(1, 1) },
  dashOffset: { value: 0 },
  dashScale: { value: 1 },
  dashSize: { value: 1 },
  gapSize: { value: 1 }, // todo FIX - maybe change to totalSize
  // Newly added
  gradientStart: { value: new THREE.Color(0xffffff) },
  gradientEnd: { value: new THREE.Color(0xffffff) },
  gradientOffset: { value: 0 },
  visibilityOffset: { value: -1 },
  totalLineSegmentInstances: { value: 2 },
  endLineWidth: { value: 10 },
};

const lineGradientVertexShader = /* glsl */ `
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

uniform float linewidth;
uniform vec2 resolution;

attribute vec3 instanceStart;
attribute vec3 instanceEnd;

attribute vec3 instanceColorStart;
attribute vec3 instanceColorEnd;

uniform vec3 gradientStart;
uniform vec3 gradientEnd;
uniform float gradientOffset;
uniform float totalLineSegmentInstances;

uniform float endLineWidth;
varying float vLineWidth;

varying float vNormalizedPointOnLine;

#ifdef WORLD_UNITS

  varying vec4 worldPos;
  varying vec3 worldStart;
  varying vec3 worldEnd;

  #ifdef USE_DASH

    varying vec2 vMapUv;

  #endif

#else

  varying vec2 vMapUv;

#endif

#ifdef USE_DASH

  uniform float dashScale;
  attribute float instanceDistanceStart;
  attribute float instanceDistanceEnd;
  varying float vLineDistance;

#endif

void trimSegment( const in vec4 start, inout vec4 end ) {

  // trim end segment so it terminates between the camera plane and the near plane

  // conservative estimate of the near plane
  float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
  float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
  float nearEstimate = - 0.5 * b / a;

  float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

  end.xyz = mix( start.xyz, end.xyz, alpha );

}

void main() {
  bool isCurve = totalLineSegmentInstances != 1.;

  // where are we on the line? [0, 1)
  float normalizedPointOnLine;

  if (!isCurve) {
    normalizedPointOnLine = position.y;
  } else {
    normalizedPointOnLine = float(gl_InstanceID - 1) / totalLineSegmentInstances;
  }

  vNormalizedPointOnLine = normalizedPointOnLine;

  if (!isCurve) {
    vLineWidth = linewidth;
  } else {
    vLineWidth = mix(linewidth, endLineWidth, normalizedPointOnLine);
  }

  #ifdef USE_COLOR

  if (!isCurve) {
    vColor.xyz = mix(
      instanceColorStart,
      instanceColorEnd,
      position.y + gradientOffset
    );
  } else {
      // if we have more than two line segments,
      // we also want to create a secondary color interpolation
      // based on the pixel position within the line segment.
      float normSegmentDistance = 1. / totalLineSegmentInstances;

      vColor.xyz = mix(
        gradientStart,
        gradientEnd,
        normalizedPointOnLine + (position.y * normSegmentDistance) + gradientOffset
      );
    }

  #endif

  #ifdef USE_DASH

    vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
    vMapUv = uv;

  #endif

  float aspect = resolution.x / resolution.y;

  // camera space
  vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
  vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

  #ifdef WORLD_UNITS

    worldStart = start.xyz;
    worldEnd = end.xyz;

  #else

    vMapUv = uv;

  #endif

  // special case for perspective projection, and segments that terminate either in, or behind, the camera plane
  // clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
  // but we need to perform ndc-space calculations in the shader, so we must address this issue directly
  // perhaps there is a more elegant solution -- WestLangley

  bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

  if ( perspective ) {

    if ( start.z < 0.0 && end.z >= 0.0 ) {

      trimSegment( start, end );

    } else if ( end.z < 0.0 && start.z >= 0.0 ) {

      trimSegment( end, start );

    }

  }

  // clip space
  vec4 clipStart = projectionMatrix * start;
  vec4 clipEnd = projectionMatrix * end;

  // ndc space
  vec3 ndcStart = clipStart.xyz / clipStart.w;
  vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

  // direction
  vec2 dir = ndcEnd.xy - ndcStart.xy;

  // account for clip-space aspect ratio
  dir.x *= aspect;
  dir = normalize( dir );

  #ifdef WORLD_UNITS

    // get the offset direction as perpendicular to the view vector
    vec3 worldDir = normalize( end.xyz - start.xyz );
    vec3 offset;
    if ( position.y < 0.5 ) {

      offset = normalize( cross( start.xyz, worldDir ) );

    } else {

      offset = normalize( cross( end.xyz, worldDir ) );

    }

    // sign flip
    if ( position.x < 0.0 ) offset *= - 1.0;

    float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

    // don't extend the line if we're rendering dashes because we
    // won't be rendering the endcaps
    #ifndef USE_DASH

      // extend the line bounds to encompass  endcaps
      start.xyz += - worldDir * vLineWidth * 0.5;
      end.xyz += worldDir * vLineWidth * 0.5;

      // shift the position of the quad so it hugs the forward edge of the line
      offset.xy -= dir * forwardOffset;
      offset.z += 0.5;

    #endif

    // endcaps
    if ( position.y > 1.0 || position.y < 0.0 ) {

      offset.xy += dir * 2.0 * forwardOffset;

    }

    // adjust for vLineWidth
    offset *= vLineWidth * 0.5;

    // set the world position
    worldPos = ( position.y < 0.5 ) ? start : end;
    worldPos.xyz += offset;

    // project the worldpos
    vec4 clip = projectionMatrix * worldPos;

    // shift the depth of the projected points so the line
    // segments overlap neatly
    vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
    clip.z = clipPose.z * clip.w;

  #else

    vec2 offset = vec2( dir.y, - dir.x );
    // undo aspect ratio adjustment
    dir.x /= aspect;
    offset.x /= aspect;

    // sign flip
    if ( position.x < 0.0 ) offset *= - 1.0;

    // endcaps
    if ( position.y < 0.0 ) {

      offset += - dir;

    } else if ( position.y > 1.0 ) {

      offset += dir;

    }

    // adjust for vLineWidth
    offset *= vLineWidth;

    // adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
    offset /= resolution.y;

    // select end
    vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

    // back to clip space
    offset *= clip.w;

    clip.xy += offset;

  #endif

  gl_Position = clip;

  vec4 mvPosition = ( position.y < 0.5 ) ? start: end; // this is an approximation

  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
  #include <fog_vertex>

}`;

const lineGradientFragmentShader = /* glsl */ `
uniform vec3 diffuse;
uniform float opacity;

uniform float visibilityOffset;
varying float vLineWidth;
varying float vNormalizedPointOnLine;

uniform vec3 gradientStart;
uniform vec3 gradientEnd;

#ifdef USE_DASH

  uniform float dashOffset;
  uniform float dashSize;
  uniform float gapSize;

#endif

varying float vLineDistance;

#ifdef WORLD_UNITS

  varying vec4 worldPos;
  varying vec3 worldStart;
  varying vec3 worldEnd;

  #ifdef USE_DASH

    varying vec2 vMapUv;

  #endif

#else

  varying vec2 vMapUv;

#endif

#include <common>
#include <color_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

  float mua;
  float mub;

  vec3 p13 = p1 - p3;
  vec3 p43 = p4 - p3;

  vec3 p21 = p2 - p1;

  float d1343 = dot( p13, p43 );
  float d4321 = dot( p43, p21 );
  float d1321 = dot( p13, p21 );
  float d4343 = dot( p43, p43 );
  float d2121 = dot( p21, p21 );

  float denom = d2121 * d4343 - d4321 * d4321;

  float numer = d1343 * d4321 - d1321 * d4343;

  mua = numer / denom;
  mua = clamp( mua, 0.0, 1.0 );
  mub = ( d1343 + d4321 * ( mua ) ) / d4343;
  mub = clamp( mub, 0.0, 1.0 );

  return vec2( mua, mub );

}

void main() {

  if (vNormalizedPointOnLine < visibilityOffset) {
    discard;
  }

  #include <clipping_planes_fragment>

  #ifdef USE_DASH

    if ( vMapUv.y < - 1.0 || vMapUv.y > 1.0 ) discard; // discard endcaps

    if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

  #endif

  float alpha = opacity;

  #ifdef WORLD_UNITS

    // Find the closest points on the view ray and the line segment
    vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
    vec3 lineDir = worldEnd - worldStart;
    vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

    vec3 p1 = worldStart + lineDir * params.x;
    vec3 p2 = rayEnd * params.y;
    vec3 delta = p1 - p2;
    float len = length( delta );
    float norm = len / vLineWidth;

    #ifndef USE_DASH

      #ifdef USE_ALPHA_TO_COVERAGE

        float dnorm = fwidth( norm );
        alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

      #else

        if ( norm > 0.5 ) {

          discard;

        }

      #endif

    #endif

  #else

    #ifdef USE_ALPHA_TO_COVERAGE

      // artifacts appear on some hardware if a derivative is taken within a conditional
      float a = vMapUv.x;
      float b = ( vMapUv.y > 0.0 ) ? vMapUv.y - 1.0 : vMapUv.y + 1.0;
      float len2 = a * a + b * b;
      float dlen = fwidth( len2 );

      if ( abs( vMapUv.y ) > 1.0 ) {

        alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

      }

    #else

      if ( abs( vMapUv.y ) > 1.0 ) {

        float a = vMapUv.x;
        float b = ( vMapUv.y > 0.0 ) ? vMapUv.y - 1.0 : vMapUv.y + 1.0;
        float len2 = a * a + b * b;

        if ( len2 > 1.0 ) discard;

      }

    #endif

  #endif

  vec4 diffuseColor = vec4( diffuse, alpha );

  #include <logdepthbuf_fragment>
  #include <color_fragment>

  gl_FragColor = vec4( diffuseColor.rgb, alpha );

  #include <tonemapping_fragment>
  #include <encodings_fragment>
  // #include <fog_fragment>
  #include <premultiplied_alpha_fragment>

}
`;

// eslint-disable-next-line import/namespace
interface LineGradientShaderParameters extends THREE.ShaderMaterialParameters {
  color?: THREE.Color;
}

class LineGradientMaterial extends THREE.ShaderMaterial {
  isLineMaterial: true;

  constructor(parameters: LineGradientShaderParameters) {
    super({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.common,
        THREE.UniformsLib.fog,
        lineGradientUniforms,
      ]),

      vertexShader: lineGradientVertexShader,
      fragmentShader: lineGradientFragmentShader,

      clipping: true, // required for clipping support
    });

    this.type = 'LineMaterialGradient';
    this.isLineMaterial = true;

    // These setters/getters need to be defined in the constructor
    // using Object.defineProperties, because they are inherited
    // and we need to overwrite them.
    Object.defineProperties(this, {
      linewidth: {
        enumerable: true,
        get() {
          return this.uniforms.linewidth.value;
        },
        set(value) {
          this.uniforms.linewidth.value = value;
        },
      },
      opacity: {
        enumerable: true,
        get() {
          return this.uniforms.opacity.value;
        },
        set(value) {
          this.uniforms.opacity.value = value;
        },
      },
      alphaToCoverage: {
        enumerable: true,
        get() {
          return Boolean('USE_ALPHA_TO_COVERAGE' in this.defines);
        },
        set(value) {
          if (Boolean(value) !== Boolean('USE_ALPHA_TO_COVERAGE' in this.defines)) {
            this.needsUpdate = true;
          }

          if (value === true) {
            this.defines.USE_ALPHA_TO_COVERAGE = '';
            this.extensions.derivatives = true;
          } else {
            delete this.defines.USE_ALPHA_TO_COVERAGE;
            this.extensions.derivatives = false;
          }
        },
      },
    });

    this.setValues(parameters);
  }

  get color() {
    return this.uniforms.diffuse.value;
  }

  set color(value) {
    this.uniforms.diffuse.value = value;
  }

  get worldUnits() {
    return 'WORLD_UNITS' in this.defines;
  }

  set worldUnits(value) {
    if (value === true) {
      this.defines.WORLD_UNITS = '';
    } else {
      delete this.defines.WORLD_UNITS;
    }
  }

  get dashed() {
    return Boolean('USE_DASH' in this.defines);
  }

  set dashed(value) {
    if (Boolean(value) !== Boolean('USE_DASH' in this.defines)) {
      this.needsUpdate = true;
    }

    if (value === true) {
      this.defines.USE_DASH = '';
    } else {
      delete this.defines.USE_DASH;
    }
  }

  get dashScale() {
    return this.uniforms.dashScale.value;
  }

  set dashScale(value) {
    this.uniforms.dashScale.value = value;
  }

  get dashSize() {
    return this.uniforms.dashSize.value;
  }

  set dashSize(value) {
    this.uniforms.dashSize.value = value;
  }

  get dashOffset() {
    return this.uniforms.dashOffset.value;
  }

  set dashOffset(value) {
    this.uniforms.dashOffset.value = value;
  }

  get gapSize() {
    return this.uniforms.gapSize.value;
  }

  set gapSize(value) {
    this.uniforms.gapSize.value = value;
  }

  get resolution() {
    return this.uniforms.resolution.value;
  }

  set resolution(value) {
    this.uniforms.resolution.value.copy(value);
  }

  get gradientStart() {
    return this.uniforms.gradientStart.value;
  }

  set gradientStart(value) {
    this.uniforms.gradientStart.value = value;
  }

  get gradientEnd() {
    return this.uniforms.gradientEnd.value;
  }

  set gradientEnd(value) {
    this.uniforms.gradientEnd.value = value;
  }

  get gradientOffset() {
    return this.uniforms.gradientOffset.value;
  }

  set gradientOffset(value) {
    this.uniforms.gradientOffset.value = value;
  }

  get visibilityOffset() {
    return this.uniforms.visibilityOffset.value;
  }

  set visibilityOffset(value) {
    this.uniforms.visibilityOffset.value = value;
  }

  get totalLineSegmentInstances() {
    return this.uniforms.totalLineSegmentInstances.value;
  }

  set totalLineSegmentInstances(value) {
    this.uniforms.totalLineSegmentInstances.value = value;
  }

  get endLineWidth() {
    return this.uniforms.endLineWidth.value;
  }

  set endLineWidth(value) {
    this.uniforms.endLineWidth.value = value;
  }
}

export { LineGradientMaterial };
