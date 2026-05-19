// FIBRATION: Hopf S³ → S²
// PROJECTION: Moving projection pole — fibers flow through infinity
// FIBERS: 80 fibers, pole traces a great circle on S³
// RENDER: Fibers morph as the projection pole rotates; one fiber "unravels" to a line

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

#define PI 3.14159265
#define TAU 6.28318530

// Quaternion multiplication
vec4 qmul(vec4 a, vec4 b) {
    return vec4(
        a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
        a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
        a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
        a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
    );
}

// Moving projection pole: traces a great circle on S³
vec4 projection_pole(float time) {
    // Rotate in the xw plane: pole = (sin(t), 0, 0, cos(t))
    float angle = time * 0.25;
    return vec4(sin(angle) * 0.8, 0.0, 0.0, cos(angle));
}

// General stereographic projection from an arbitrary pole on S³
// Project from pole P: (point - P) / (1 - dot(point, P)), mapped to P_perp subspace
vec3 stereo_from_pole(vec4 point, vec4 pole) {
    float denom = 1.0 - dot(point, pole);
    if (abs(denom) < 0.001) return vec3(1e6);

    // Project to the 3-plane perpendicular to the pole
    // Use a fixed orthonormal frame for the perpendicular space
    // For pole near (0,0,0,1), this recovers standard stereographic
    vec4 diff = point - pole;
    vec4 proj = diff / denom;

    // Extract three coordinates orthogonal to pole
    // Build frame from pole
    vec4 e0 = vec4(1.0, 0.0, 0.0, 0.0);
    vec4 e1 = vec4(0.0, 1.0, 0.0, 0.0);
    vec4 e2 = vec4(0.0, 0.0, 1.0, 0.0);

    // Gram-Schmidt: remove pole component
    e0 = normalize(e0 - dot(e0, pole) * pole);
    e1 = normalize(e1 - dot(e1, pole) * pole - dot(e1, e0) * e0);
    e2 = normalize(e2 - dot(e2, pole) * pole - dot(e2, e0) * e0 - dot(e2, e1) * e1);

    return vec3(dot(proj, e0), dot(proj, e1), dot(proj, e2));
}

// Fiber point on S³
vec4 fiber_point(vec3 s2_point, float t) {
    float p1 = s2_point.x;
    float p2 = s2_point.y;
    float p3 = s2_point.z;

    float d = sqrt(2.0 * (1.0 + p3));
    vec4 u, v;

    if (d > 0.001) {
        u = vec4(0.0, (1.0 + p3) / d, -p2 / d, p1 / d);
        v = vec4(d / 2.0, 0.0, p1 / d, p2 / d);
    } else {
        u = vec4(1.0, 0.0, 0.0, 0.0);
        v = vec4(0.0, 0.0, 1.0, 0.0);
    }

    return cos(t) * u + sin(t) * v;
}

float dist_to_segment(vec3 p, vec3 a, vec3 b) {
    vec3 ab = b - a;
    float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
    return length(p - (a + ab * t));
}

// Color: encode which fiber is "special" (near the pole) differently
vec3 fiber_color(vec3 s2_point, vec4 pole) {
    float lon = atan(s2_point.y, s2_point.x);
    float lat = asin(s2_point.z);

    // Check how close this fiber is to the pole's fiber
    // The pole lives in the fiber over its own Hopf image
    // Simple approximation: color by angular distance from pole direction
    vec3 pole_s2 = vec3(
        2.0 * (pole.x * pole.z + pole.y * pole.w),
        2.0 * (pole.y * pole.z - pole.x * pole.w),
        pole.x * pole.x + pole.y * pole.y - pole.z * pole.z - pole.w * pole.w
    );

    float dist_from_special = acos(clamp(dot(s2_point, pole_s2), -1.0, 1.0)) / PI;

    float hue = lon / TAU + 0.5;
    float sat = 0.4 + 0.6 * dist_from_special;
    float val = 0.6 + 0.4 * (1.0 - dist_from_special);

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

    vec3 col = vec3(0.01, 0.01, 0.03);

    vec4 pole = projection_pole(u_time);

    // Slowly orbit camera
    float cam_angle = u_time * 0.1;
    vec3 cam_pos = vec3(cos(cam_angle) * 3.0, sin(cam_angle) * 1.5, 2.5);

    float min_dist = 1e6;
    vec3 nearest_col = vec3(0.0);

    for (float i = 0.0; i < 80.0; i++) {
        float phi = acos(1.0 - 2.0 * (i + 0.5) / 80.0);
        float theta = TAU * i * 0.6180339887;

        vec3 s2_pt = vec3(sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi));
        vec3 fcol = fiber_color(s2_pt, pole);

        float t_step = TAU / 40.0;
        vec3 prev_proj = vec3(1e6);

        for (float j = 0.0; j <= 40.0; j++) {
            float t = j * t_step;
            vec4 p4 = fiber_point(s2_pt, t);
            vec3 proj = stereo_from_pole(p4, pole);

            if (j > 0.0 && length(proj) < 120.0 && length(prev_proj) < 120.0) {
                float d = dist_to_segment(cam_pos, prev_proj, proj);
                if (d < min_dist) {
                    min_dist = d;
                    nearest_col = fcol;
                }
            }
            prev_proj = proj;
        }
    }

    // Glow
    float brightness = exp(-min_dist * min_dist * 80.0);
    col += nearest_col * brightness * 2.5;

    // Subtle pulse tied to pole motion
    float pulse = 0.5 + 0.5 * sin(u_time * 0.5);
    col += vec3(0.05, 0.1, 0.15) * pulse * exp(-length(st - 0.5) * 3.0);

    // Vignette
    col *= 1.0 - smoothstep(0.5, 1.4, length(st - 0.5));

    gl_FragColor = vec4(col, 1.0);
}
