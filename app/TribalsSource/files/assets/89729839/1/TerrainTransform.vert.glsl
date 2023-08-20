uniform sampler2D texture_height;
uniform float height;
uniform float power;
uniform float water_power;
uniform float under_water;

uniform vec2 scale;
uniform vec2 offset;

mat4 getModelMatrix() {
    #ifdef DYNAMICBATCH
    return getBoneMatrix(vertex_boneIndices);
    #elif defined(SKIN)
    return matrix_model * getSkinMatrix(vertex_boneIndices, vertex_boneWeights);
    #elif defined(INSTANCING)
    return mat4(instance_line1, instance_line2, instance_line3, instance_line4);
    #else
    return matrix_model;
    #endif
}

vec4 getPosition() {
    dModelMatrix = getModelMatrix();
    vec3 localPos = vertex_position;

    vec4 posW   = dModelMatrix * vec4(localPos, 1.0);
    //vec2 UV     = posW.xy * 0.01 + vec2(0.5, 0.5);

    vec2 UV = vec2(
        posW.x, 
        posW.z
    ) * scale + offset;

    float color = texture2D(texture_height, UV).g;

    posW.y+=height - pow(color, power) * height;

    if(color >= 0.875){
        posW.y-= pow(color, water_power) * under_water;
    }

    dPositionW = posW.xyz;

    return matrix_viewProjection * posW;
}

vec3 getWorldPosition() {
    return dPositionW;
}
