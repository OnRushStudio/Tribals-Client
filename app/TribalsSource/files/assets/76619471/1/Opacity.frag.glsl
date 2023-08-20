uniform mat4 matrix_viewInverse;

#ifdef MAPFLOAT
uniform float material_opacity;
#endif

#ifdef MAPTEXTURE
uniform sampler2D texture_opacityMap;
#endif

uniform float minDistance;
uniform float maxDistance;
uniform float fadeFactor;

void getOpacity() {
    dAlpha = 1.0;

    #ifdef MAPFLOAT
    dAlpha *= material_opacity;
    #endif

    #ifdef MAPTEXTURE
    dAlpha *= texture2D(texture_opacityMap, $UV).$CH;
    #endif

    #ifdef MAPVERTEX
    dAlpha *= clamp(vVertexColor.$VC, 0.0, 1.0);
    #endif

    #ifdef GRASS
        vec3 CameraPosition = matrix_viewInverse[3].xyz;
        float distance = distance(CameraPosition, vPositionW);

        if(distance > minDistance){
            dAlpha *= 1.0 - (maxDistance - distance) / fadeFactor;
        }else{

        }
    #endif
}
