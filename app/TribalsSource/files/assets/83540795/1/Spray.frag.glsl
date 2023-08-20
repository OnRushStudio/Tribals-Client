uniform mat4 transform_1;
uniform mat4 transform_2;
uniform mat4 transform_3;
uniform mat4 transform_4;
uniform vec4 spray_matrix;
uniform float intensity;
uniform float offset_1;
uniform float offset_2;
uniform float offset_3;
uniform float offset_4;
uniform sampler2D texture_splat;

#ifdef MAPCOLOR
uniform vec3 material_diffuse;
#endif

#ifdef MAPTEXTURE
uniform sampler2D texture_diffuseMap;
#endif

vec4 getSprayColor(mat4 transform, float offset) {
    float cutOffset = 0.0;
    float height = 0.25;
    vec4 projPos = transform * vec4(vPositionW, 1.0);
    projPos.xy /= projPos.w;
    projPos.xy += vec2(0.5, -offset + 1.0 - height * 0.5);

    vec2 projectionUV = mat2(spray_matrix) * (projPos.xy-vec2(0.5)) + vec2(0.5);
    vec4 spray = texture2D(texture_splat, projectionUV);

    if(projectionUV.y > offset && projectionUV.y < height + offset){
        return spray.rgba;
    }else{
        return vec4(0.0);
    }
}

void getAlbedo() {
    vec4 sprayColor = vec4(0.0);
    float opacity = 0.0;

    if(intensity > 0.0){
        sprayColor = getSprayColor(transform_1, offset_1);
        sprayColor += getSprayColor(transform_2, offset_2) * 0.33;
        sprayColor += getSprayColor(transform_3, offset_3) * 0.33;
        sprayColor += getSprayColor(transform_4, offset_4) * 0.33;

        sprayColor.rgb*=3.0;
        
        opacity = min(sprayColor.a, 1.0);
    }

    dAlbedo = vec3(1.0);

    #ifdef MAPCOLOR
        dAlbedo *= material_diffuse.rgb;
    #endif

    #ifdef MAPTEXTURE
        vec3 albedoBase = gammaCorrectInput(texture2DBias(texture_diffuseMap, $UV, textureBias).$CH);
        dAlbedo *= addAlbedoDetail(albedoBase);
    #endif

    #ifdef MAPVERTEX
        dAlbedo *= gammaCorrectInput(saturate(vVertexColor.$VC));
    #endif

    dAlbedo = mix(sprayColor.rgb * 1.2, dAlbedo, 1.0 - opacity);
    
    //return mix(sprayColor.rgb * dAlbedo, dAlbedo * dDiffuseLight, (1.0 - sprayColor.a));
}
