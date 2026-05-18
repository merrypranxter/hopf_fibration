// FIBRATION: Hopf S³ → S²
// PROJECTION: Stereographic with density gradient
// FIBERS: 150 fibers, dense near projection point, sparse at infinity
// RENDER: Glass-like transparency, nested tori visible as shells

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

#define PI 3.14159265
#define TAU 6.28318530

// 4D rotation
vec4 rotate4D(vec4 p, float time) {
    float c1 = cos(time * 0.2);
    float s1 = sin(time * 0.2);
    float c2 = cos(time * 0.15);
    float s2 = sin(time * 0.15);
    
    vec4 r1 = vec4(
        p.x * c1 - p.y * s1,
        p.x * s1 + p.y * c1,
        p.z,
        p.w
    );
    
    vec4 r2 = vec4(
        r1.x,
        r1.y,
        r1.z * c2 - r1.w * s2,
        r1.z * s2 + r1.w * c2
    );
    
    return r2;
}

// Stereographic projection
vec3 stereo_project(vec4 p) {
    float denom = 1.0 - p.w;
    if (abs(denom) < 0.001) return vec3(1e6);
    return p.xyz / denom;
}

// Fiber point
vec4 fiber_point(vec3 s2_point, float t) {
    float p1 = s2_point.x;
    float p2 = s2_point.y;
    float p3 = s2_point.z;
    
    float denom = sqrt(2.0 * (1.0 + p3));
    vec4 u, v;
    
    if (denom > 0.001) {
        u = vec4(0.0, (1.0 + p3) / denom, -p2 / denom, p1 / denom);
        v = vec4(denom / 2.0, 0.0, p1 / denom, p2 / denom);
    } else {
        u = vec4(1.0, 0.0, 0.0, 0.0);
        v = vec4(0.0, 0.0, 1.0, 0.0);
    }
    
    return cos(t) * u + sin(t) * v;
}

// Distance to segment
float dist_to_segment(vec3 p, vec3 a, vec3 b) {
    vec3 ab = b - a;
    float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
    return length(p - (a + ab * t));
}

// S² color mapping
vec3 s2_color(vec3 s2_point) {
    float lon = atan(s2_point.y, s2_point.x);
    float lat = asin(s2_point.z);
    
    float hue = lon / TAU + 0.5;
    float sat = 0.6 + 0.4 * cos(lat * 2.0);
    float val = 0.7 + 0.3 * cos(lat);
    
    vec3 rgb;
    float h = hue * 6.0;
    float c = val * sat;
    float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
    float m = val - c;
    
    if (h < 1.0) rgb = vec3(c, x, 0.0);
    else if (h < 2.0) rgb = vec3(x, c, 0.0);
    else if (h < 3.0) rgb = vec3(0.0, c, x);
    else if (h < 4.0) rgb = vec3(0.0, x, c);
    else if (h < 5.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    
    return rgb + m;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;
    
    vec3 cam_pos = vec3(0.0, 0.0, 2.5);
    vec3 cam_dir = normalize(vec3(st - 0.5, -1.0));
    
    vec3 col = vec3(0.01, 0.02, 0.04); // deeper void
    
    // Accumulate fiber contributions (transparency)
    vec3 accum = vec3(0.0);
    float accum_alpha = 0.0;
    
    for (float i = 0.0; i < 150.0; i++) {
        float fi = i;
        
        // Fibonacci sphere with density gradient: more fibers near poles
        float t = fi / 150.0;
        float phi = acos(1.0 - 2.0 * t);
        float theta = TAU * fi * 0.6180339887;
        
        // Density gradient: pack more near projection point
        float density = 1.0 / (1.0 + abs(t - 0.5) * 4.0);
        if (fract(fi * 0.37) > density) continue; // skip for density control
        
        vec3 s2_point = vec3(
            sin(phi) * cos(theta),
            sin(phi) * sin(theta),
            cos(phi)
        );
        
        vec3 fiber_col = s2_color(s2_point);
        
        // Walk fiber with fine steps
        float t_step = TAU / 48.0;
        vec3 prev_proj = vec3(1e6);
        
        for (float j = 0.0; j <= 48.0; j++) {
            float t_j = j * t_step;
            vec4 p4 = fiber_point(s2_point, t_j);
            p4 = rotate4D(p4, u_time);
            vec3 proj = stereo_project(p4);
            
            if (j > 0.0 && length(proj) < 100.0) {
                float d = dist_to_segment(cam_pos, prev_proj, proj);
                
                // Glass-like transparency: thin tubes
                float tube = exp(-d * d * 200.0);
                float depth = 1.0 / (1.0 + length(proj - cam_pos) * 0.3);
                
                accum += fiber_col * tube * depth * 0.3;
                accum_alpha += tube * depth * 0.3;
            }
            
            prev_proj = proj;
        }
    }
    
    // Blend with transparency
    col += accum * (1.0 - exp(-accum_alpha));
    
    // Torus shell effect: nested rings at specific radii
    float r = length(st - 0.5);
    for (float k = 1.0; k <= 5.0; k++) {
        float torus_r = k * 0.12;
        float shell = exp(-(r - torus_r) * (r - torus_r) * 400.0);
        col += vec3(0.3, 0.4, 0.5) * shell * 0.15;
    }
    
    // Vignette
    float vig = 1.0 - smoothstep(0.4, 1.2, length(st - 0.5));
    col *= vig;
    
    gl_FragColor = vec4(col, 1.0);
}
