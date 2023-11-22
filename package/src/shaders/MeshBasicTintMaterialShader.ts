export const MeshBasicTintVertexShader = `
  #include <common>
  #include <uv_pars_vertex>
    uniform vec3 tintColor;
  varying vec3 vTintColor;
  uniform float discardValue;
  uniform float isLookingAtCamera;
  varying float vDiscardValue;
  uniform float isDiscardEnabled;
  varying float vIsDiscardEnabled;
  uniform vec2 tintFlag;
  varying vec2 vTintFlag;

  void main() {
    vTintColor = tintColor;
    vTintFlag = tintFlag;
    vIsDiscardEnabled = isDiscardEnabled;
    vDiscardValue = discardValue;
    #include <uv_vertex>

    float scale = modelMatrix[0][0];

    if (isLookingAtCamera > 0.0) {
      mat4 modelView = modelViewMatrix;
      modelView[0][0] = scale;
      modelView[0][1] = 0.0;
      modelView[0][2] = 0.0;
      modelView[1][0] = 0.0;
      modelView[1][1] = scale;
      modelView[1][2] = 0.0;
      modelView[2][0] = 0.0;
      modelView[2][1] = 0.0;
      modelView[2][2] = scale;
      vec4 p = modelView * vec4(position, 1.0);

      gl_Position = projectionMatrix * p;
    } else {
      vec4 p = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * p;
    }
  }
`;

export const MeshBasicTintFragmentShader = `
  uniform vec3 diffuse;
  uniform float opacity;
  varying vec3 vTintColor;
  varying vec2 vTintFlag;
  varying float vIsDiscardEnabled;
  varying float vDiscardValue;
  #include <common>
  #include <uv_pars_fragment>
  #include <map_pars_fragment>

  void main() {
    vec3 outgoingLight = vec3( 0.0 );
    vec4 diffuseColor = vec4( diffuse, opacity );
    vec3 totalAmbientLight = vec3( 1.0 );
    vec3 shadowMask = vec3( 1.0 );

    #include <map_fragment>
    outgoingLight = diffuseColor.rgb * totalAmbientLight * shadowMask;
    if (vTintFlag.x > 0.0) {
      gl_FragColor = vec4( vTintColor , diffuseColor.a );
    } else {
      gl_FragColor = vec4( outgoingLight, diffuseColor.a );
    }

    if (vIsDiscardEnabled > 0.0 && gl_FragColor.w < vDiscardValue) discard;
    #include <premultiplied_alpha_fragment>
  }
`;
