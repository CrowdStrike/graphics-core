export const GradientVertexShader = `
    precision highp float;
    precision highp int;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
      vUv = vec2(position.x, position.y) * 0.5 + 0.5;
    }
`;

export const GradientFragmentShader = `
    precision highp float;
    precision highp int;

    uniform highp vec3 color1;
    uniform highp vec3 color2;
    uniform float opacity;
    varying highp vec2 vUv;
    void main() {
      gl_FragColor = vec4(mix(color1, color2, vUv.y),opacity);
    }
`;
