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

export const InstancedUvVertexShader = `
  #include <common>
  #include <uv_pars_vertex>

  #include <instanced_display_attributes_pars_vertex>

  attribute vec4 uvOffset;

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

    #ifdef USE_OUTLINE
      #include <outline_vertex>
    #endif
  }
`;

export const InstancedUvFragmentShader = `
  #include <common>

  #include <uv_pars_fragment>
  #include <map_pars_fragment>

  uniform vec3 diffuse;

  #include <instanced_display_attributes_pars_fragment>

  #ifdef USE_DEBUG_BOUNDS
    #include <debug_bounds_pars_fragment>
  #endif

  #ifdef USE_OUTLINE
    #include <outline_pars_fragment>
  #endif

  void main() {
    if (vDisplay < 0.5) discard;

    gl_FragColor = vec4(
      vColor,
      vOpacity *  texture2D(map, vMapUv).a
    );

    #ifdef USE_OUTLINE
      #include <outline_fragment>
    #endif

    #ifdef USE_DEBUG_BOUNDS
      #include <debug_bounds_fragment>
    #endif

    #include <premultiplied_alpha_fragment>
  }
`;
