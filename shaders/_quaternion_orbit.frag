// FIBRATION: Hopf S³ → S²
// PROJECTION: Standard stereographic
// NAVIGATION: Left-action by a unit quaternion q(t) rotates all of S³
// RENDER: Interactive orbit — user navigates S³ by applying quaternion left-action
//         Here q(t) is automated for demonstration: a geodesic on S³

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
// Optional: uniform vec4 u_quat; // drive from JS for interactivity

#define PI 3.14159265
#define TAU 6.28318530

// Quaternion multiplication: q * p (left action)
vec4 qmul(vec4 q, vec4 p) {
    // Convention: (w, x, y, z) stored as vec4(x, y, z, w)
    return vec4(
        q.w * p.x + q.x * p.w + q.y * p.z - q.z * p.y,
        q.w * p.y - q.x * p.z + q.y * p.w + q.z * p.x,
        q.w * p.z + q.x * p.y - q.y * p.x + q.z * p.w,
        q.w * p.w - q.x * p.x - q.y * p.y - q.z * p.z
    );
}

// Right action: p * q
vec4 qmul_right(vec4 p, vec4 q) {
    return qmul(p, q);
}

// Navigation quaternion: geodesic on S³
// Combines two independent rotations to explore the full SO(4) structure
vec4 nav_quaternion(float time) {
    // Left rotation: spin around (1,0,0) axis
    float angle1 = time * 0.18;
    vec4 q1 = vec4(sin(angle1) * 1.0, 0.0, 0.0, cos(angle1));

    // Right rotation: spin around (0,1,0) axis  
    float angle2 = time * 0.11;
    vec4 q2 = vec4(0.0, sin(angle2) * 1.0, 0.0, cos(angle2));

    // Combined: q1 (left action explores Hopf fibers at fixed base point)
    //           q2 (right action moves between fibers)
    return normalize(qmul(q1, q2));
}

// Stereographic projection: S³ → R³
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

vec3 s2_color(vec3 s2_point) {
    float lon = atan(s2_point.y, s2_point.x);
    float lat = asin(s2_point.z);

    float hue = lon / TAU + 0.5;
    float sat = 0.55 + 0.45 * cos(lat * 2.0);
    float val = 0.75 + 0.25 * cos(lat);

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

// Hopf map: S³ → S²
// h(x,y,z,w) = (2(xz+yw), 2(yz-xw), x²+y²-z²-w²)
vec3 hopf_map(vec4 p) {
    return vec3(
        2.0 * (p.x * p.z + p.y * p.w),
        2.0 * (p.y * p.z - p.x * p.w),
        p.x * p.x + p.y * p.y - p.z * p.z - p.w * p.w
    );
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    vec3 col = vec3(0.01, 0.015, 0.03);

    // Current navigation quaternion (left action)
    vec4 q_nav = nav_quaternion(u_time);

    vec3 cam_pos = vec3(0.0, 0.0, 3.2);
    float min_dist = 1e6;
    vec3 nearest_col = vec3(0.0);

    // Two layers: standard fibers + the orbit path itself
    int N_FIBERS = 70;

    for (float i = 0.0; i < 70.0; i++) {
        float phi = acos(1.0 - 2.0 * (i + 0.5) / 70.0);
        float theta = TAU * i * 0.6180339887;

        vec3 s2_pt = vec3(sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi));
        vec3 fcol = s2_color(s2_pt);

        float t_step = TAU / 36.0;
        vec3 prev_proj = vec3(1e6);

        for (float j = 0.0; j <= 36.0; j++) {
            float t = j * t_step;
            vec4 p4 = fiber_point(s2_pt, t);

            // Apply left-action navigation quaternion: q * p
            p4 = qmul(q_nav, p4);

            vec3 proj = stereo_project(p4);

            if (j > 0.0 && length(proj) < 100.0 && length(prev_proj) < 100.0) {
                float d = dist_to_segment(cam_pos, prev_proj, proj);
                if (d < min_dist) {
                    min_dist = d;
                    nearest_col = fcol;
                }
            }
            prev_proj = proj;
        }
    }

    // Also render the orbit path of a single reference point under q(t)
    // This traces a great circle on S³, projected to a circle in R³
    vec3 orbit_col = vec3(1.0, 0.9, 0.6); // golden
    vec3 ref_point = normalize(vec4(1.0, 0.0, 0.0, 0.0)).xyz; // use as parameter
    vec3 prev_orbit = vec3(1e6);

    for (float j = 0.0; j <= 60.0; j++) {
        float tt = j / 60.0 * TAU;
        // Trace orbit of (1,0,0,0) under q(theta) = (sin(tt)*axis, cos(tt))
        vec4 q_orbit = vec4(sin(tt), 0.0, 0.0, cos(tt));
        vec4 orbit_pt = qmul(q_orbit, vec4(0.5, 0.5, 0.0, 0.7071));
        vec3 proj_orbit = stereo_project(orbit_pt);

        if (j > 0.0 && length(proj_orbit) < 100.0 && length(prev_orbit) < 100.0) {
            float d = dist_to_segment(cam_pos, prev_orbit, proj_orbit);
            if (d < 0.08) {
                float brightness = exp(-d * d * 300.0) * 1.5;
                col += orbit_col * brightness;
            }
        }
        prev_orbit = proj_orbit;
    }

    // Main fiber glow
    float glow = exp(-min_dist * min_dist * 90.0);
    col += nearest_col * glow * 2.2;

    // Vignette
    col *= 1.0 - smoothstep(0.5, 1.5, length(st - 0.5));

    gl_FragColor = vec4(col, 1.0);
}
