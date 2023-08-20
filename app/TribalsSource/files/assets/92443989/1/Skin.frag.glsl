
#ifdef MAPCOLOR
uniform vec3 material_diffuse;
#endif
#ifdef MAPTEXTURE
uniform sampler2D texture_diffuseMap;
#endif

uniform sampler2D tattoo_Texture;
uniform float tattoo_Scale;
uniform vec2 tattoo_Offset;

uniform float skin_Color;

void getAlbedo() {
    dAlbedo = vec3(1.0);
    dAlbedo *= material_diffuse.rgb * skin_Color;
    
    #ifdef MAPTEXTURE
        vec3 albedoBase = gammaCorrectInput(texture2D(texture_diffuseMap, $UV, textureBias).$CH);
        dAlbedo *= addAlbedoDetail(albedoBase);
    #endif
    #ifdef MAPVERTEX
        dAlbedo *= gammaCorrectInput(saturate(vVertexColor.$VC));
    #endif

    float tattooBase = texture2D(tattoo_Texture, $UV * tattoo_Scale + tattoo_Offset, textureBias).a;

    if(tattooBase > 0.1){
        dAlbedo*=dAlbedo * vec3(0.2, 0.2, 0.2);
    }

}
