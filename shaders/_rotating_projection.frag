// FIBRATION: Hopf S³ → S²
// PROJECTION: Animated stereographic — projection point orbits a great circle on S³
// FIBERS: 80 fibers, Fibonacci sphere sampling
// RENDER: Fibers near the moving pole unfold dramatically through space

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

#define PI  3.14159265358979
#define TAU 6.28318530717959

// ---------------------------------------------------------------------------
// Fiber parametrization
// For s2_point (p1,p2,p3) on S², the Hopf fiber is:
//   t ↦ cos(t)*u + sin(t)*v
// where u,v are orthonormal vectors in R⁴ spanning the fiber plane.
// ---------------------------------------------------------------------------
vec4 fiber_point(vec3 s2_point, float t) {
    float p1 = s2_point.x;
    float p2 = s2_point.y;
    float p3 = s2_point.z;

    float denom = sqrt(2.0 * (1.0 + p3));
    vec4 u, v;

    if (denom > 0.001) {
        // General case
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
// Stereographic projection from an arbitrary pole Q on S³.
//
// Derivation: the standard formula projects P ∈ S³ from pole Q onto the
// hyperplane tangent to S³ at -Q.  Setting d = dot(P, Q):
//
//   projected = (P - d*Q) / (1.0 - d)
//
// The xyz components give the point in R³ (the w component equals -1 in the
// tangent hyperplane convention, confirming the formula).
// ---------------------------------------------------------------------------
vec3 stereo_project_pole(vec4 P, vec4 Q) {
    float d = dot(P, Q);
    float denom = 1.0 - d;
    if (abs(denom) < 0.001) return vec3(1e6); // P near the pole → infinity
    vec4 proj4 = (P - d * Q) / denom;
    return proj4.xyz;
}

// ---------------------------------------------------------------------------
// Moving projection pole: orbits the great circle
//   Q(t) = cos(t) * (0,0,0,1) + sin(t) * (0,0,1,0)
// This causes successive fibers to pass through infinity as Q(t) sweeps past
// their own S³ location.
// ---------------------------------------------------------------------------
vec4 projection_pole(float t) {
    return vec4(0.0, 0.0, sin(t), cos(t));
}

// ---------------------------------------------------------------------------
// Distance from point p to line segment [a,b]
// ---------------------------------------------------------------------------
float dist_to_segment(vec3 p, vec3 a, vec3 b) {
    vec3 ab = b - a;
    float len2 = dot(ab, ab);
    if (len2 < 1e-8) return length(p - a);
    float tt = clamp(dot(p - a, ab) / len2, 0.0, 1.0);
    return length(p - (a + ab * tt));
}

// ---------------------------------------------------------------------------
// Color by S² longitude/latitude (hue = longitude, value varies with latitude)
// ---------------------------------------------------------------------------
vec3 s2_color(vec3 s2_point) {
    float lon = atan(s2_point.y, s2_point.x); // [-π, π]
    float lat = asin(clamp(s2_point.z, -1.0, 1.0)); // [-π/2, π/2]

    float hue = lon / TAU + 0.5;
    float sat = 0.75 + 0.25 * cos(lat * 2.0);
    float val = 0.8  + 0.2  * sin(lat + PI * 0.5);

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

    // Ray origin in R³ (simple orthographic-style view)
    vec3 cam_pos = vec3(0.0, 0.0, 4.0);

    // Current animated pole
    vec4 Q = projection_pole(u_time * 0.4);

    vec3 col      = vec3(0.015, 0.02, 0.04);
    float min_dist = 1e6;
    vec3  nearest_color = vec3(0.0);

    // Accumulate glow for fibers close to the pole (dramatic unfolding effect)
    float pole_glow = 0.0;

    for (float i = 0.0; i < 80.0; i++) {
        // Fibonacci sphere sampling of S²
        float phi   = acos(1.0 - 2.0 * (i + 0.5) / 80.0);
        float theta = TAU * i * 0.6180339887498949; // golden angle

        vec3 s2_pt = vec3(
            sin(phi) * cos(theta),
            sin(phi) * sin(theta),
            cos(phi)
        );

        vec3 fiber_col = s2_color(s2_pt);

        // How close is the S³ fiber to the current pole Q?
        // A fiber's "distance" to Q is measured by how close any point on it
        // gets: the minimum |P - Q|² over t is 1 - max|<P,Q>|².
        // For the pole orbit this creates a smooth activation envelope.
        vec4 fp0 = fiber_point(s2_pt, 0.0);
        vec4 fp1 = fiber_point(s2_pt, PI * 0.5);
        float nearPole = max(abs(dot(fp0, Q)), abs(dot(fp1, Q)));
        float activation = smoothstep(0.7, 1.0, nearPole);

        // Boost brightness for fibers near the pole (unfolding effect)
        fiber_col = mix(fiber_col, vec3(1.0), activation * 0.6);

        // Walk the fiber — 40 steps
        float t_step = TAU / 40.0;
        vec3 prev_proj = vec3(1e6);

        for (float j = 0.0; j <= 40.0; j++) {
            float t = j * t_step;
            vec4 P = fiber_point(s2_pt, t);
            vec3 proj = stereo_project_pole(P, Q);

            if (j > 0.0 && length(proj) < 80.0 && length(prev_proj) < 80.0) {
                float d = dist_to_segment(cam_pos, prev_proj, proj);
                if (d < min_dist) {
                    min_dist = d;
                    nearest_color = fiber_col;
                }
            }
            prev_proj = proj;
        }

        pole_glow += activation * 0.015;
    }

    // Luminous thread glow
    float glow = exp(-min_dist * min_dist * 80.0);
    col += nearest_color * glow * 2.5;

    // Ambient pole-sweep corona
    col += vec3(0.6, 0.4, 0.9) * pole_glow * exp(-length(st - 0.5) * 3.0);

    // Vignette
    float vig = 1.0 - smoothstep(0.45, 1.3, length(st - 0.5));
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
}
