uniform mat4 matrix_viewInverse;

#ifdef PIXELSNAP
uniform vec4 uScreenSize;
#endif

#ifdef MORPHING
uniform vec4 morph_weights_a;
uniform vec4 morph_weights_b;
#endif

uniform float timestamp;
uniform sampler2D perlin;
uniform sampler2D heightMap;


uniform sampler2D grassMap;

uniform float height;
uniform float power;
uniform float size;

#ifdef MORPHING_TEXTURE_BASED
uniform vec4 morph_tex_params;

vec2 getTextureMorphCoords() {
    float vertexId = morph_vertex_id;
    vec2 textureSize = morph_tex_params.xy;
    vec2 invTextureSize = morph_tex_params.zw;

    // turn vertexId into int grid coordinates
    float morphGridV = floor(vertexId * invTextureSize.x);
    float morphGridU = vertexId - (morphGridV * textureSize.x);

    // convert grid coordinates to uv coordinates with half pixel offset
    return (vec2(morphGridU, morphGridV) * invTextureSize) + (0.5 * invTextureSize);
}
#endif

#ifdef MORPHING_TEXTURE_BASED_POSITION
uniform highp sampler2D morphPositionTex;
#endif

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

    #ifdef NINESLICED
    // outer and inner vertices are at the same position, scale both
    localPos.xz *= outerScale;

    // offset inner vertices inside
    // (original vertices must be in [-1;1] range)
    vec2 positiveUnitOffset = clamp(vertex_position.xz, vec2(0.0), vec2(1.0));
    vec2 negativeUnitOffset = clamp(-vertex_position.xz, vec2(0.0), vec2(1.0));
    localPos.xz += (-positiveUnitOffset * innerOffset.xy + negativeUnitOffset * innerOffset.zw) * vertex_texCoord0.xy;

    vTiledUv = (localPos.xz - outerScale + innerOffset.xy) * -0.5 + 1.0; // uv = local pos - inner corner

    localPos.xz *= -0.5; // move from -1;1 to -0.5;0.5
    localPos = localPos.xzy;
    #endif

    #ifdef MORPHING
    #ifdef MORPHING_POS03
    localPos.xyz += morph_weights_a[0] * morph_pos0;
    localPos.xyz += morph_weights_a[1] * morph_pos1;
    localPos.xyz += morph_weights_a[2] * morph_pos2;
    localPos.xyz += morph_weights_a[3] * morph_pos3;
    #endif // MORPHING_POS03
    #ifdef MORPHING_POS47
    localPos.xyz += morph_weights_b[0] * morph_pos4;
    localPos.xyz += morph_weights_b[1] * morph_pos5;
    localPos.xyz += morph_weights_b[2] * morph_pos6;
    localPos.xyz += morph_weights_b[3] * morph_pos7;
    #endif // MORPHING_POS47
    #endif // MORPHING

    #ifdef MORPHING_TEXTURE_BASED_POSITION
    // apply morph offset from texture
    vec2 morphUV = getTextureMorphCoords();
    vec3 morphPos = texture2D(morphPositionTex, morphUV).xyz;
    localPos += morphPos;
    #endif

    vec4 posW = dModelMatrix * vec4(localPos, 1.0);
    #ifdef SCREENSPACE
    posW.zw = vec2(0.0, 1.0);
    #endif
    dPositionW = posW.xyz;

    vec4 screenPos;
    #ifdef UV1LAYOUT
    screenPos = vec4(vertex_texCoord1.xy * 2.0 - 1.0, 0.5, 1);
    #else
    #ifdef SCREENSPACE
    screenPos = posW;
    #else
    screenPos = matrix_viewProjection * posW;
    #endif

    #ifdef PIXELSNAP
    // snap vertex to a pixel boundary
    screenPos.xy = (screenPos.xy * 0.5) + 0.5;
    screenPos.xy *= uScreenSize.xy;
    screenPos.xy = floor(screenPos.xy);
    screenPos.xy *= uScreenSize.zw;
    screenPos.xy = (screenPos.xy * 2.0) - 1.0;
    #endif
    #endif

    #ifdef PLANT
        vec2 perlinVector = texture2D(perlin, vec2(
            timestamp, timestamp
        ) * localPos.xz * 5.0).xy;

        float distanceFromCenter = max(min(localPos.x * localPos.z, 1.0), -1.0);

        //posW.x+=localPos.y * cos(perlinVector.y) * 0.25;
        posW.y-=distanceFromCenter * perlinVector.x * 0.5;

        //posW.z+=localPos.y * sin(perlinVector.y) * 0.5;

        dPositionW = posW.xyz;
    
        screenPos = matrix_viewProjection * posW;
    #endif

    #ifdef PALM
        vec2 perlinVector = texture2D(perlin, vec2(
            timestamp * 0.35, timestamp * 0.35
        ) * localPos.xz * 5.0).xy;

        float distanceFromCenter = max(min(localPos.x * localPos.z, 1.0), -1.0);

        if(posW.y > 5.0){
            posW.y+=distanceFromCenter * (perlinVector.x - 0.5) * 0.415;
            posW.x-=distanceFromCenter * (perlinVector.y - 0.5) * 0.815;
            posW.z+=distanceFromCenter * (perlinVector.y - 0.5) * 0.815;
        }

        dPositionW = posW.xyz;
    
        screenPos = matrix_viewProjection * posW;
    #endif

    #ifdef GRASS
        vec2 perlinVector = texture2D(perlin, vec2(
            timestamp, timestamp
        ) * localPos.xz * 0.02).xy;

        vec4 worldPosition   = dModelMatrix * vec4(localPos, 1.0);
        vec2 UV     = worldPosition.xz * size + vec2(0.5, 0.5);

        float color = texture2D(
            heightMap, 
            vec2(UV.x, -UV.y + 1.0)
        ).g;

        float grassColor = texture2D(
            grassMap, 
            vec2(UV.x, -UV.y + 1.0)
        ).g;

        float currentHeight = height - pow(color, power) * height;
        posW.y+=currentHeight;

        if(grassColor < 0.6){
            posW.y = -1000.0;
        }

        if(currentHeight < 0.5){
            posW.y = -1000.0;
        }

        

        //posW.y+=30.0 - 30.0 * color;

        posW.x+=localPos.y * (perlinVector.x - 0.5) * 0.015;
        posW.z+=localPos.y * (perlinVector.x - 0.5) * 0.015;

        dPositionW = posW.xyz;
    
        screenPos = matrix_viewProjection * posW;
    #endif
           
    return screenPos; 
}

vec3 getWorldPosition() {
    return dPositionW;
}
