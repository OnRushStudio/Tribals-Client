#ifdef MAPCOLOR
uniform vec3 material_emissive;
#endif
#ifdef MAPFLOAT
uniform float material_emissiveIntensity;
#endif
#ifdef MAPTEXTURE
uniform sampler2D texture_emissiveMap;
#endif

uniform vec4 colorA;
uniform vec4 colorB;

uniform float strength;
uniform float power;
uniform float frenselTime;

void getEmission() {
    float fresnel = dot(dNormalW + dNormalW * (cos(frenselTime)) * 0.25, dViewDirW);
    
    dEmission = mix(
        colorA.rgb, 
        colorB.rgb, 
        min(
            1.0, 
            pow(
                strength + fresnel, power + cos(frenselTime)
            )
        )
    );

    if(power > 8.0){
        dEmission = vec3(1.0, 0.0, 0.0);
    }
}
