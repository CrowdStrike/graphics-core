### Shader fragments dictionary

Here are some shader fragment we include in our shaders, which THREE.js expands when compiling the shaders.

I've included them here to avoid having going to `src/renderers/shaders/ShaderChunk/`, in the THREE.js repo and looking them up.

##### #include <uv_pars_vertex>
#ifdef USE_UV
  #ifdef UVS_VERTEX_ONLY
    vec2 vUv;
  #else
    varying vec2 vUv;
  #endif

  uniform mat3 mapTransform;
#endif


##### #include <uv2_pars_vertex>
#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
  attribute vec2 uv2;
  varying vec2 vUv2;

  uniform mat3 uv2Transform;
#endif

##### #include <uv_vertex>
#ifdef USE_UV
  vUv = ( mapTransform * vec3( uv, 1 ) ).xy;
#endif

##### #include <uv2_vertex>
#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
  vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;
#endif

##### #include <begin_vertex>
vec3 transformed = vec3(position);


##### #include <project_vertex>
vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif

mvPosition = modelViewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;


##### #include <uv_pars_fragment>
#if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
  varying vec2 vUv;
#endif

##### #include <uv2_pars_fragment>
#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
  varying vec2 vUv2;
#endif

##### #include <map_pars_fragment>
#ifdef USE_MAP
  uniform sampler2D map;
#endif

##### #include <map_fragment>
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vUv );
  #ifdef DECODE_VIDEO_TEXTURE
    // inline sRGB decode (TODO: Remove this code when https://crbug.com/1256340 is solved)
    sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
  #endif
  diffuseColor *= sampledDiffuseColor;
#endif

##### #include <premultiplied_alpha_fragment>
#ifdef PREMULTIPLIED_ALPHA
  // Get get normal blending with premultipled, use with CustomBlending, OneFactor, OneMinusSrcAlphaFactor, AddEquation.
  gl_FragColor.rgb *= gl_FragColor.a;
#endif
