// FIBRATION: Hopf S³ → S²
// PROJECTION: Standard stereographic, after quaternion left- and right-action
// FIBERS: 80 fibers, Fibonacci sphere sampling
// RENDER: Two independent quaternion rotations create a rich "flying through S³" effect

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

#define PI  3.14159265358979
#define TAU 6.28318530717959

// ---------------------------------------------------------------------------
// Quaternion multiplication.
// Quaternions stored as vec4(x, y, z, w) = xi + yj + zk + w.
// Product rule: if a = (a.xyz, a.w), b = (b.xyz, b.w),
//   ab.w   = a.w*b.w - dot(a.xyz, b.xyz)
//   ab.xyz = a.w*b.xyz + b.w*a.xyz + cross(a.xyz, b.xyz)
// ---------------------------------------------------------------------------
vec4 qmul(vec4 a, vec4 b) {
    return vec4(
        a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz),
        a.w * b.w   - dot(a.xyz, b.xyz)
    );
}

// ---------------------------------------------------------------------------
// Build a unit quaternion from a pure-imaginary exponent:
//   exp(i*angle_i + j*angle_j) = cos(|v|) + sin(|v|)/|v| * v
// where v = (angle_i, angle_j, 0).
// ---------------------------------------------------------------------------
vec4 qexp_ij(float angle_i, float angle_j) {
    vec3 v    = vec3(angle_i, angle_j, 0.0);
    float len = length(v);
    if (len < 1e-6) return vec4(0.0, 0.0, 0.0, 1.0);
    return vec4(sin(len) * v / len, cos(len));
}

// ---------------------------------------------------------------------------
// Fiber parametrization: t ↦ cos(t)*u + sin(t)*v
// ---------------------------------------------------------------------------
vec4 fiber_point(vec3 s2_point, float t) {
    float p1 = s2_point.x;
    float p2 = s2_point.y;
    float p3 = s2_point.z;

    float denom = sqrt(2.0 * (1.0 + p3));
    vec4 u, v;

    if (denom > 0.001) {
        u = vec4(0.0, (1.0 + p3) / denom, -p2 / denom,  p1 / denom);
        v = vec4(denom / 2.0,        0.0,  p1 / denom,  p2 / denom);
    } else {
        // South pole p3 ≈ -1: fiber is {(0,0,cos t,sin t)} → a line in R³
        u = vec4(0.0, 0.0, 1.0, 0.0);
        v = vec4(0.0, 0.0, 0.0, 1.0);
    }

    return cos(t) * u + sin(t) * v;
}

// ---------------------------------------------------------------------------
// Standard stereographic projection from north pole (0,0,0,1)
// ---------------------------------------------------------------------------
vec3 stereo_project(vec4 p) {
    float denom = 1.0 - p.w;
    if (abs(denom) < 0.001) return vec3(1e6);
    return p.xyz / denom;
}

// ---------------------------------------------------------------------------
// Distance from point p to line segment [a,b]
// ---------------------------------------------------------------------------
float dist_to_segment(vec3 p, vec3 a, vec3 b) {
    vec3 ab  = b - a;
    float len2 = dot(ab, ab);
    if (len2 < 1e-8) return length(p - a);
    float tt = clamp(dot(p - a, ab) / len2, 0.0, 1.0);
    return length(p - (a + ab * tt));
}

// ---------------------------------------------------------------------------
// Color by fiber index position on S²
// ---------------------------------------------------------------------------
vec3 s2_color(vec3 s2_point) {
    float lon = atan(s2_point.y, s2_point.x);
    float lat = asin(clamp(s2_point.z, -1.0, 1.0));

    float hue = lon / TAU + 0.5;
    float sat = 0.7 + 0.3 * cos(lat * 2.0);
    float val = 0.75 + 0.25 * cos(lat);

    float h6 = hue * 6.0;
    float c  = val * sat;
    float x  = c * (1.0 - abs(mod(h6, 2.0) - 1.0));
    float m  = val - c;

    vec3 rgb;
    if      (h6 < 1.0) rgb = vec3(c, x, 0.0);
    else if (h6 < 2.0) rgb = vec3(x, c, 0.0);
    else if (h6 < 3.0) rgb = vec3(0.0, c, x);
    else if (h6 < 4.0) rgb = vec3(0.0, x, c);
    else if (h6 < 5.0) rgb = vec3(x, 0.0, c);
    else               rgb = vec3(c, 0.0, x);

    return rgb + m;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    vec3 cam_pos = vec3(0.0, 0.0, 3.5);

    // Left-action quaternion q(t) = exp(i*0.3t + j*0.1t)
    vec4 q_left  = qexp_ij(u_time * 0.3, u_time * 0.1);

    // Right-action quaternion r(t) = exp(i*0.07t + j*0.17t)  — different speed
    vec4 q_right = qexp_ij(u_time * 0.07, u_time * 0.17);

    vec3 col       = vec3(0.015, 0.02, 0.04);
    float min_dist = 1e6;
    vec3  nearest_color = vec3(0.0);

    for (float i = 0.0; i < 80.0; i++) {
        // Fibonacci sphere
        float phi   = acos(1.0 - 2.0 * (i + 0.5) / 80.0);
        float theta = TAU * i * 0.6180339887498949;

        vec3 s2_pt = vec3(
            sin(phi) * cos(theta),
            sin(phi) * sin(theta),
            cos(phi)
        );

        vec3 fiber_col = s2_color(s2_pt);

        float t_step = TAU / 40.0;
        vec3 prev_proj = vec3(1e6);

        for (float j = 0.0; j <= 40.0; j++) {
            float t = j * t_step;

            // Base point on S³
            vec4 P = fiber_point(s2_pt, t);

            // Apply left quaternion action: P' = q_left * P
            vec4 P1 = qmul(q_left, P);

            // Apply right quaternion action: P'' = P' * q_right
            vec4 P2 = qmul(P1, q_right);

            // Renormalize to stay on S³ (floating-point drift guard)
            P2 = normalize(P2);

            vec3 proj = stereo_project(P2);

            if (j > 0.0 && length(proj) < 80.0 && length(prev_proj) < 80.0) {
                float d = dist_to_segment(cam_pos, prev_proj, proj);
                if (d < min_dist) {
                    min_dist = d;
                    nearest_color = fiber_col;
                }
            }
            prev_proj = proj;
        }
    }

    // Luminous thread
    float glow = exp(-min_dist * min_dist * 90.0);
    col += nearest_color * glow * 2.5;

    // Soft center bloom
    float bloom = exp(-length(st - 0.5) * length(st - 0.5) * 3.0);
    col += vec3(0.05, 0.08, 0.14) * bloom;

    // Vignette
    float vig = 1.0 - smoothstep(0.45, 1.3, length(st - 0.5));
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
}
