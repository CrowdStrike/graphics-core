/**
 * This material is to be used with THREE.InstancedMesh.
 *
 * #include <begin_vertex>
 * #include <project_vertex>
 *
 * will handle offsetting the position of the element based on the
 * automatically provided attribute mat4 instanceMatrix;
 */

// this will add the necessary THREE.ShaderChunks

// eslint-disable-next-line import/no-unassigned-import
import './fragments/outline';
// eslint-disable-next-line import/no-unassigned-import
import './fragments/debug-bounds';
// eslint-disable-next-line import/no-unassigned-import
import './fragments/instanced-display-attributes';

export const InstancedMultiUvVertexShader = `
  #include <common>
  #include <uv_pars_vertex>

  #include <instanced_display_attributes_pars_vertex>

  attribute vec4 uvOffset;

  attribute float texIdx;
  flat varying int vTexIdx;

  #ifdef USE_DEBUG_BOUNDS
    #include <debug_bounds_pars_vertex>
  #endif

  #ifdef USE_OUTLINE
    #include <outline_pars_vertex>
  #endif

  void main() {
    #include <instanced_display_attributes_vertex>


    #include <uv_vertex>

    #include <begin_vertex>
    #include <project_vertex>

    vMapUv = (mapTransform * vec3(uvOffset.xy, 1.)).xy + uv * uvOffset.zw;

    #ifdef USE_DEBUG_BOUNDS
      #include <debug_bounds_vertex>
    #endif

    vTexIdx = int(texIdx);

    #ifdef USE_OUTLINE
      #include <outline_vertex>
    #endif
  }
`;

export const InstancedMultiUvFragmentShader = (numTextures: number) => `
  #include <common>
  #include <uv_pars_fragment>
  #include <map_pars_fragment>

  uniform sampler2D u_textures[${numTextures}];

  uniform vec3 diffuse;

  #include <instanced_display_attributes_pars_fragment>

  flat varying int vTexIdx;

  #ifdef USE_DEBUG_BOUNDS
    #include <debug_bounds_pars_fragment>
  #endif

  vec4 sampledColor;


  #ifdef USE_OUTLINE
    #include <outline_pars_fragment>
  #endif

  void main() {
    if (vDisplay < 0.5) discard;

    #ifdef USE_OUTLINE
      vec4 insideColor;
      vec4 outsideColor;
    #endif

    ${unrollTextureArrayLoop(numTextures)}

    #ifdef USE_SAMPLED_COLOR
      vec4 diffuseColor = vec4( diffuse, vOpacity );
      diffuseColor *= sampledColor;

      // This might be useful for sampling videos or image;
      // See the example in graphics-core
      gl_FragColor = vec4( diffuseColor.xyz, diffuseColor.a );
    #else
      // This is useful if we just want to tint the alpha map;
      // eg. for iconography
      gl_FragColor = vec4( vColor, vOpacity * sampledColor.a );
    #endif

    #ifdef USE_OUTLINE
      insideColor = vec4(
        vColor,
        vOpacity *  sampledColor.a
      );

      if (outsideColor.a > .0 && insideColor.a < 0.1) {
        gl_FragColor = outsideColor;
      } else {
        gl_FragColor = insideColor;
      }

      gl_FragColor.a = outsideColor.a + insideColor.a;
    #endif

    #ifdef USE_DEBUG_BOUNDS
    #include <debug_bounds_fragment>
    #endif

    #include <premultiplied_alpha_fragment>
  }
`;

const unrollTextureArrayLoop = (loops: number) => {
  let s = ``;

  for (let i = 0; i < loops; i++) {
    if (i === 0) {
      s += `if(vTexIdx == 0){
        sampledColor = texture2D( u_textures[0], vMapUv );
        #ifdef USE_OUTLINE
        outsideColor = vec4(
          borderColor.xyz,
          vOpacity * texture2D(u_textures[0], vUvOutsideSample).a
        );
        #endif
      }\n`;
    } else {
      s += `else if(vTexIdx == ${i}){
        sampledColor = texture2D( u_textures[${i}], vMapUv );
        #ifdef USE_OUTLINE
        outsideColor = vec4(
          borderColor.xyz,
          vOpacity * texture2D(u_textures[${i}], vUvOutsideSample).a
        );
        #endif
      }\n`;
    }
  }

  return s;
};
