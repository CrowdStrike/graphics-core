import * as THREE from 'three';

const circleWithRing = `
  float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }

  vec4 circleWithRing(float d) {
    float isCircle = (1.0 - step(0.48 - vRingWidth, d));

    vec4 c = vec4(vColor, vIsHovered);

    // reduce transparency between circle and ring
    // TODO circle edges need smoothing
    float circleAlpha = vIsHovered - clamp(step(.46 - vRingWidth, d), 0., vIsHovered);

    float isRing = cubicPulse(.5 - vRingWidth, vRingWidth, d);

    vec4 rc = vec4(vRingColor, isRing);

    if (isCircle == 1.) {
      return c;
    }

    if (isRing > 0.) {
      // assigns a [0, 1] value to the point on the circular ring
      float alphaOfPointOnCircle = map(
        atan(vMapUv.y - 0.5, vMapUv.x - 0.5),
        -PI,
        PI,
        0.,
        1.
      );

      rc.a = -1. + alphaOfPointOnCircle + (vIsSelected * 2.);
      rc.a *= vIsSelected;

      return rc;
    }
  }
`;

const cubicPulse = `
  //  Function from Iñigo Quiles
  //  www.iquilezles.org/www/articles/functions/functions.htm
  float cubicPulse( float c, float w, float x ){
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
  }
`;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['circle_with_ring'] = circleWithRing;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
THREE.ShaderChunk['cubic_pulse'] = cubicPulse;
