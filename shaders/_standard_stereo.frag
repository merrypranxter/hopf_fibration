// FIBRATION: Hopf S³ → S²
// PROJECTION: Standard stereographic from (0,0,0,1)
// FIBERS: 60 fibers, uniform sampling of S² base space
// RENDER: Luminous threads with density gradient, linked circles visible

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

#define PI 3.14159265
#define TAU 6.28318530

// 4D rotation matrix (simplified: rotate in xy and zw planes)
vec4 rotate4D(vec4 p, float time) {
    float c1 = cos(time * 0.2);
    float s1 = sin(time * 0.2);
    float c2 = cos(time * 0.15);
    float s2 = sin(time * 0.15);
    
    // Rotate in xy plane
    vec4 r1 = vec4(
        p.x * c1 - p.y * s1,
        p.x * s1 + p.y * c1,
        p.z,
        p.w
    );
    
    // Rotate in zw plane
    vec4 r2 = vec4(
        r1.x,
        r1.y,
        r1.z * c2 - r1.w * s2,
        r1.z * s2 + r1.w * c2
    );
    
    return r2;
}

// Stereographic projection: S³ → R³
vec3 stereo_project(vec4 p) {
    // Project from (0,0,0,1), so divide by (1 - w)
    float denom = 1.0 - p.w;
    if (abs(denom) < 0.001) {
        // Point near projection center — goes to infinity
        return vec3(1e6);
    }
    return p.xyz / denom;
}

// Inverse Hopf: given a point on S², find a point on the fiber
vec4 inverse_hopf(vec3 s2_point) {
    // s2_point is on S², so |s2_point| = 1
    // We need a point on S³ that maps to this point under Hopf
    // Simplified: use the standard fiber parametrization
    
    float p1 = s2_point.x;
    float p2 = s2_point.y;
    float p3 = s2_point.z;
    
    // Find orthonormal basis for the fiber plane
    float denom = sqrt(2.0 * (1.0 + p3));
    vec4 u, v;
    
    if (denom > 0.001) {
        u = vec4(0.0, (1.0 + p3) / denom, -p2 / denom, p1 / denom);
        v = vec4(denom / 2.0, 0.0, p1 / denom, p2 / denom);
    } else {
        // South pole p3 ≈ -1: fiber is {(0,0,cos t,sin t)} → a line in R³
        u = vec4(0.0, 0.0, 1.0, 0.0);
        v = vec4(0.0, 0.0, 0.0, 1.0);
    }
    
    // Return a specific point on the fiber (t=0)
    return u;
}

// Point on fiber: t ∈ [0, 2π]
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
        // South pole p3 ≈ -1: fiber is {(0,0,cos t,sin t)} → a line in R³
        u = vec4(0.0, 0.0, 1.0, 0.0);
        v = vec4(0.0, 0.0, 0.0, 1.0);
    }
    
    return cos(t) * u + sin(t) * v;
}

// Distance from point to line segment
float dist_to_segment(vec3 p, vec3 a, vec3 b) {
    vec3 ab = b - a;
    float len2 = dot(ab, ab);
    if (len2 < 1e-8) return length(p - a);
    float t = clamp(dot(p - a, ab) / len2, 0.0, 1.0);
    return length(p - (a + ab * t));
}

// Color from S² coordinates
vec3 s2_color(vec3 s2_point) {
    // Map S² to color: longitude → hue, latitude → saturation
    float lon = atan(s2_point.y, s2_point.x); // [-π, π]
    float lat = asin(s2_point.z); // [-π/2, π/2]
    
    float hue = lon / TAU + 0.5; // [0, 1]
    float sat = 0.5 + 0.5 * cos(lat * 2.0); // varies with latitude
    float val = 0.8 + 0.2 * cos(lat); // brighter at equator
    
    // HSV to RGB
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
    
    // Camera in R³
    vec3 cam_pos = vec3(0.0, 0.0, 3.0);
    vec3 cam_dir = normalize(vec3(st - 0.5, -1.0));
    
    vec3 col = vec3(0.02, 0.03, 0.05); // deep space background
    
    // Sample fibers
    float min_dist = 1e6;
    vec3 nearest_color = vec3(0.0);
    
    for (float i = 0.0; i < 60.0; i++) {
        float fi = i;
        
        // Sample base point on S² (Fibonacci sphere)
        float phi = acos(1.0 - 2.0 * (fi + 0.5) / 60.0);
        float theta = TAU * fi * 0.6180339887; // golden ratio
        
        vec3 s2_point = vec3(
            sin(phi) * cos(theta),
            sin(phi) * sin(theta),
            cos(phi)
        );
        
        // Color for this fiber
        vec3 fiber_col = s2_color(s2_point);
        
        // Walk the fiber
        float t_step = TAU / 32.0;
        vec3 prev_proj = vec3(1e6);
        
        for (float j = 0.0; j <= 32.0; j++) {
            float t = j * t_step;
            vec4 p4 = fiber_point(s2_point, t);
            p4 = rotate4D(p4, u_time);
            vec3 proj = stereo_project(p4);
            
            if (j > 0.0 && length(proj) < 100.0) {
                // Distance from camera ray to fiber segment
                float d = dist_to_segment(cam_pos, prev_proj, proj);
                
                if (d < min_dist) {
                    min_dist = d;
                    nearest_color = fiber_col;
                }
            }
            
            prev_proj = proj;
        }
    }
    
    // Render fiber as luminous thread
    float glow = exp(-min_dist * min_dist * 100.0);
    col += nearest_color * glow * 2.0;
    
    // Density gradient: more fibers = brighter center
    float center_glow = exp(-length(st - 0.5) * length(st - 0.5) * 2.0);
    col += vec3(0.1, 0.15, 0.2) * center_glow * 0.5;
    
    // Vignette
    float vig = 1.0 - smoothstep(0.5, 1.5, length(st - 0.5));
    col *= vig;
    
    gl_FragColor = vec4(col, 1.0);
}
