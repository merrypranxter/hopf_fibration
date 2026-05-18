// camera_paths.glsl
// GLSL helper functions for navigating S³ via quaternion actions.
// Intended for inclusion (or copy-paste) into WebGL fragment shaders.
// All quaternions are stored as vec4(x, y, z, w) = xi + yj + zk + w.

precision highp float;

// ---------------------------------------------------------------------------
// Quaternion multiplication: (a.xyz + a.w) * (b.xyz + b.w)
//   result.xyz = a.w*b.xyz + b.w*a.xyz + cross(a.xyz, b.xyz)
//   result.w   = a.w*b.w   - dot(a.xyz, b.xyz)
// ---------------------------------------------------------------------------
vec4 qmul(vec4 a, vec4 b) {
    return vec4(
        a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz),
        a.w * b.w   - dot(a.xyz, b.xyz)
    );
}

// ---------------------------------------------------------------------------
// Quaternion from axis-angle.
// axis must be a unit vector; angle is in radians.
// q = cos(angle/2) + sin(angle/2) * axis
// ---------------------------------------------------------------------------
vec4 qfrom_axis_angle(vec3 axis, float angle) {
    float half = angle * 0.5;
    return vec4(sin(half) * axis, cos(half));
}

// ---------------------------------------------------------------------------
// Left quaternion action on a point p ∈ S³:
//   p' = q * p
// Preserves the Hopf fibration; permutes fibers among themselves.
// ---------------------------------------------------------------------------
vec4 q_left_action(vec4 q, vec4 p) {
    return normalize(qmul(q, p));
}

// ---------------------------------------------------------------------------
// Right quaternion action on a point p ∈ S³:
//   p' = p * q
// Also preserves the Hopf fibration, with a different symmetry axis.
// ---------------------------------------------------------------------------
vec4 q_right_action(vec4 p, vec4 q) {
    return normalize(qmul(p, q));
}

// ---------------------------------------------------------------------------
// Spherical linear interpolation (SLERP) between two S³ points.
// Returns the point at fractional distance t ∈ [0,1] along the geodesic
// from a to b.
//   slerp(a, b, t) = sin((1-t)*Ω)/sin(Ω) * a + sin(t*Ω)/sin(Ω) * b
// where Ω = arccos(<a, b>).
// ---------------------------------------------------------------------------
vec4 slerp(vec4 a, vec4 b, float t) {
    float cosOmega = dot(a, b);

    // If the quaternions point in opposite hemispheres, negate one so we
    // travel the short way around S³.
    if (cosOmega < 0.0) {
        b        = -b;
        cosOmega = -cosOmega;
    }

    // If nearly identical, fall back to linear interpolation.
    if (cosOmega > 0.9995) {
        return normalize(mix(a, b, t));
    }

    float Omega    = acos(clamp(cosOmega, -1.0, 1.0));
    float sinOmega = sin(Omega);
    float wa = sin((1.0 - t) * Omega) / sinOmega;
    float wb = sin(t          * Omega) / sinOmega;
    return normalize(wa * a + wb * b);
}

// ---------------------------------------------------------------------------
// Smooth camera path through S³.
//
// Traces a geodesic loop that visits four anchor points on S³, smoothly
// interpolated.  The period is 2π in t.
//
// The anchors are chosen to give an interesting visual orbit:
//   A = identity quaternion (1, 0, 0, 0)  — "home"
//   B = 90° rotation around the i-axis
//   C = 90° rotation around the j-axis
//   D = 90° rotation around the k-axis
// ---------------------------------------------------------------------------
vec4 camera_path(float t) {
    // Normalize t to [0, 1) over a full period
    float s = fract(t / (2.0 * 3.14159265358979));

    // Four anchor points on S³
    vec4 A = vec4(0.0, 0.0, 0.0,  1.0);                         // identity
    vec4 B = qfrom_axis_angle(vec3(1.0, 0.0, 0.0), 1.5707963);  // 90° around i
    vec4 C = qfrom_axis_angle(vec3(0.0, 1.0, 0.0), 1.5707963);  // 90° around j
    vec4 D = qfrom_axis_angle(vec3(0.0, 0.0, 1.0), 1.5707963);  // 90° around k

    // Smooth step through each quarter of the path
    float seg = s * 4.0;
    float f   = fract(seg);

    // Ease-in / ease-out within each segment via smoothstep
    float ef = smoothstep(0.0, 1.0, f);

    if      (seg < 1.0) return slerp(A, B, ef);
    else if (seg < 2.0) return slerp(B, C, ef);
    else if (seg < 3.0) return slerp(C, D, ef);
    else                return slerp(D, A, ef);
}
