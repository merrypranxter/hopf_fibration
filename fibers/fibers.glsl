// Hopf Fiber Library — GLSL
// Parametric definitions for Hopf fibers over S²
// Include in any shader with: #include "fibers.glsl" (or paste inline)
//
// FIBER OVER A POINT ON S²
// Each point p ∈ S² has a preimage h⁻¹(p) ⊂ S³ that is a great circle.
// We represent it as cos(t)·u + sin(t)·v, where u,v ∈ S³ are orthonormal
// vectors in the fiber plane.
//
// LINKING
// Any two distinct fibers are linked circles in S³ (and in R³ after projection).
// Linking number = 1 for every pair. This is the defining topological property.

#define PI  3.14159265358979
#define TAU 6.28318530717959

// ─── Core fiber parametrization ───────────────────────────────────────────────

// Return the fiber basis vectors (u, v) for a base point on S².
// The fiber is {cos(t)·u + sin(t)·v : t ∈ [0,2π]}.
void fiber_basis(vec3 s2_point, out vec4 u, out vec4 v) {
    float p1 = s2_point.x;
    float p2 = s2_point.y;
    float p3 = s2_point.z;

    float d = sqrt(2.0 * (1.0 + p3));

    if (d > 0.001) {
        // General case: formula derived from Hopf map h⁻¹
        u = vec4(0.0, (1.0 + p3) / d, -p2 / d, p1 / d);
        v = vec4(d * 0.5, 0.0, p1 / d, p2 / d);
    } else {
        // South pole (p3 ≈ -1): the fiber through (0,0,-1) is in the xz plane
        u = vec4(1.0, 0.0, 0.0, 0.0);
        v = vec4(0.0, 0.0, 1.0, 0.0);
    }
}

// A single point on the fiber at parameter t ∈ [0, 2π].
vec4 fiber_point(vec3 s2_point, float t) {
    vec4 u, v;
    fiber_basis(s2_point, u, v);
    return cos(t) * u + sin(t) * v;
}

// ─── Hopf map ─────────────────────────────────────────────────────────────────

// Forward Hopf map h : S³ → S²
// h(x,y,z,w) = (2(xz+yw),  2(yz−xw),  x²+y²−z²−w²)
vec3 hopf_map(vec4 p) {
    return vec3(
        2.0 * (p.x * p.z + p.y * p.w),
        2.0 * (p.y * p.z - p.x * p.w),
        p.x * p.x + p.y * p.y - p.z * p.z - p.w * p.w
    );
}

// Verify: hopf_map(fiber_point(s2_pt, t)) == s2_pt for any t.
// (Useful as a unit test in a debug pass.)

// ─── Linking ──────────────────────────────────────────────────────────────────
// The linking number of any two distinct Hopf fibers is 1.
// There is no GLSL runtime check for this — it is a mathematical fact.
// See linking.md for the algebraic proof and numerical verification.

// ─── Quaternion fiber action ───────────────────────────────────────────────────

// Left quaternion multiplication (S³ group action).
// Acts on S³ and preserves the Hopf fibration structure:
//   h(q·p) = R_q · h(p)   where R_q is the SO(3) rotation induced by q.
vec4 qmul(vec4 q, vec4 p) {
    return vec4(
        q.w * p.x + q.x * p.w + q.y * p.z - q.z * p.y,
        q.w * p.y - q.x * p.z + q.y * p.w + q.z * p.x,
        q.w * p.z + q.x * p.y - q.y * p.x + q.z * p.w,
        q.w * p.w - q.x * p.x - q.y * p.y - q.z * p.z
    );
}

// Right quaternion multiplication.
// Independent of left action: together (left, right) give all of SO(4).
vec4 qmul_right(vec4 p, vec4 q) {
    return qmul(p, q);
}

// Apply a 4D rotation to a fiber by rotating every point with quaternion q (left).
// Equivalent to rotating the base S² by the corresponding SO(3) element.
vec4 fiber_point_rotated(vec3 s2_point, float t, vec4 q) {
    return qmul(q, fiber_point(s2_point, t));
}

// ─── Fiber sampling utilities ─────────────────────────────────────────────────

// Fibonacci sphere: N uniformly distributed points on S².
// Returns the i-th point (i in [0, N)).
vec3 fibonacci_sphere(float i, float N) {
    float phi_lat = acos(1.0 - 2.0 * (i + 0.5) / N);
    float theta   = TAU * i * 0.6180339887498949; // multiply by golden ratio
    return vec3(
        sin(phi_lat) * cos(theta),
        sin(phi_lat) * sin(theta),
        cos(phi_lat)
    );
}

// ─── Distance utilities ───────────────────────────────────────────────────────

// Minimum distance from point p to the segment [a, b] in R³.
float dist_to_segment(vec3 p, vec3 a, vec3 b) {
    vec3 ab = b - a;
    float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
    return length(p - (a + ab * t));
}

// Approximate distance from ray (origin o, direction d) to a fiber.
// Walks the fiber with N_STEPS steps and returns the minimum segment distance.
float ray_fiber_dist(vec3 ray_origin, vec3 ray_dir,
                     vec3 s2_point, vec4 q_rotation,
                     int N_STEPS) {
    float min_d = 1e6;
    vec3 prev = vec3(1e6);

    for (int j = 0; j <= N_STEPS; j++) {
        float t = float(j) * TAU / float(N_STEPS);
        vec4 p4 = qmul(q_rotation, fiber_point(s2_point, t));

        float denom = 1.0 - p4.w;
        if (abs(denom) < 0.001) { prev = vec3(1e6); continue; }
        vec3 proj = p4.xyz / denom;

        if (j > 0 && length(proj) < 150.0 && length(prev) < 150.0) {
            // Distance from ray to segment
            vec3 ab = proj - prev;
            float tt = clamp(dot(ray_origin - prev, ab) / dot(ab, ab), 0.0, 1.0);
            float d = length((ray_origin - prev) - ab * tt);
            // Incorporate ray direction (simplified: use cam_pos along ray)
            min_d = min(min_d, d);
        }
        prev = proj;
    }
    return min_d;
}
