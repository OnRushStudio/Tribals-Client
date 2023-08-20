uniform mat4 transform;
uniform vec4 spray_matrix;
uniform float intensity;
uniform float timestamp;
uniform vec4 color_0;
uniform vec4 color_1;

uniform sampler2D texture_splat;
uniform sampler2D texture_alpha;

vec2 projectionUV;

vec4 getSprayColor() {
    vec4 projPos = transform * vec4(vPositionW, 1.0);
    projPos.xy /= projPos.w;
    projPos.xy += vec2(0.5, 0.5);

    vec3 color = vec3(0.0, 0.0, 0.0);

    projectionUV = mat2(spray_matrix) * (projPos.xy-vec2(0.5)) + vec2(0.5);

    float scale = max(1.0 - timestamp * 0.05, 0.0);
    vec2 center = vec2(0.5, 0.5);

    vec2 center_vector = projectionUV * scale - center * scale + center;
    vec3 alpha_channel = texture2D(texture_alpha, center_vector).rgb;
    
    vec3 texture_fire = texture2D(texture_splat, projectionUV * 0.4 + vec2(0.0, 0.0)).rgb;
    vec3 texture_smoke = texture2D(texture_splat, projectionUV * 0.4 + vec2(timestamp, timestamp) * 0.35).rgb;
    vec3 smoke_alpha = texture2D(texture_splat, projectionUV * vec2(0.8, 0.4) + vec2(texture_smoke.r * 0.4, timestamp) * 0.4).rgb;
    vec3 yellow = smoothstep(0.75, 0.95, texture_fire.rgb + smoke_alpha.rgb);
    vec3 red = smoothstep(0.1, 0.45, texture_smoke.rgb * smoke_alpha.rgb);

    color.rgb = (1.0 - yellow) * color_0.rgb + (1.0 - red) * color_1.rgb;

    float alpha = smoothstep(0.25, 0.6, color.r);

    //opacity = 1.0;

    //vec4 spray = texture2D(texture_splat, projectionUV);

    return vec4(color.rgb + yellow.rgb * (1.0 - timestamp) * 0.05, max(min(alpha - alpha_channel.r, 1.0) * (1.0 - scale * 0.5), 0.0));
}

vec3 combineColor() {

    vec4 sprayColor = vec4(0.0);

    if(intensity > 0.0){ 
        sprayColor = getSprayColor();
    }
    
    return mix(dAlbedo * dDiffuseLight * (1.0 - timestamp * 0.1), sprayColor.rgb * max(1.0 - timestamp * 0.07, 0.0), sprayColor.a);
}
