// Quaternion Navigation for S³
// ─────────────────────────────────────────────────────────────────────────────
// S³ is the group of unit quaternions. The Hopf fibration is equivariant under
// the left S³ action:  q · p  →  h(q·p) = R_q · h(p)
//
// This means rotating S³ by q on the left rotates the entire base sphere S²
// by the corresponding SO(3) element R_q — it permutes fibers without changing
// their shape or linking number.
//
// Two kinds of S³ navigation:
//   LEFT ACTION  q·p  — moves between fibers (rotates base S²)
//   RIGHT ACTION p·q  — moves within fibers (rotates within each fiber)
//
// Together they span all of SO(4), which acts on S³ ⊂ R⁴.
// ─────────────────────────────────────────────────────────────────────────────

#define PI  3.14159265358979
#define TAU 6.28318530717959

// ─── Quaternion algebra ───────────────────────────────────────────────────────

// Convention: vec4 = (x, y, z, w) = xi + yj + zk + w (w is real part)
vec4 qmul(vec4 q, vec4 p) {
    return vec4(
        q.w*p.x + q.x*p.w + q.y*p.z - q.z*p.y,
        q.w*p.y - q.x*p.z + q.y*p.w + q.z*p.x,
        q.w*p.z + q.x*p.y - q.y*p.x + q.z*p.w,
        q.w*p.w - q.x*p.x - q.y*p.y - q.z*p.z
    );
}

vec4 qconj(vec4 q) {
    return vec4(-q.xyz, q.w);
}

vec4 qinverse(vec4 q) {
    return qconj(q); // unit quaternions: inverse = conjugate
}

// Rotate a 3D vector by a unit quaternion: v' = q·v·q*
vec3 qrotate(vec4 q, vec3 v) {
    vec4 vq = vec4(v, 0.0);
    return qmul(qmul(q, vq), qconj(q)).xyz;
}

// ─── S³ rotation generators ───────────────────────────────────────────────────

// Rotation in the XY plane (generator: ij-plane bivector = k)
vec4 rot_xy(float angle) {
    return vec4(0.0, 0.0, sin(angle * 0.5), cos(angle * 0.5));
}

// Rotation in the XZ plane (generator: ik-plane bivector = -j)
vec4 rot_xz(float angle) {
    return vec4(0.0, sin(angle * 0.5), 0.0, cos(angle * 0.5));
}

// Rotation in the XW plane (generator: i, pure left action on first factor)
vec4 rot_xw(float angle) {
    return vec4(sin(angle * 0.5), 0.0, 0.0, cos(angle * 0.5));
}

// Rotation in the YZ plane (generator: jk = i)
vec4 rot_yz(float angle) {
    return vec4(sin(angle * 0.5), 0.0, 0.0, cos(angle * 0.5));
}

// Rotation in the YW plane
vec4 rot_yw(float angle) {
    return vec4(0.0, sin(angle * 0.5), 0.0, cos(angle * 0.5));
}

// Rotation in the ZW plane (generator: pure k)
vec4 rot_zw(float angle) {
    return vec4(0.0, 0.0, sin(angle * 0.5), cos(angle * 0.5));
}

// ─── Camera paths through S³ ──────────────────────────────────────────────────

// Path 1: Great circle in the XW plane.
// Traces the orbit of (1,0,0,0) under the subgroup {e^(ti)} ⊂ S³.
// After stereographic projection: the identity (1,0,0,0) stays at origin;
// the antipode (-1,0,0,0) also stays at origin (they're in the same fiber).
// This path visits every fiber exactly once.
vec4 path_great_circle_xw(float t) {
    return vec4(sin(t), 0.0, 0.0, cos(t));
}

// Path 2: Hopf fiber orbit — stays within a single fiber.
// Applying right action e^(it) keeps the base point fixed,
// moving the camera along one fiber.
// This is the motion that looks stationary in S² but spins in S³.
vec4 path_fiber_orbit(float t, vec3 base_point) {
    // Right action by e^(it): moves within the fiber over base_point
    vec4 q_right = vec4(0.0, 0.0, sin(t), cos(t)); // rotate in zw
    // Starting point on the fiber
    float p3 = base_point.z;
    float d = sqrt(2.0 * (1.0 + p3));
    vec4 start;
    if (d > 0.001) {
        start = vec4(0.0, (1.0 + p3) / d, -base_point.y / d, base_point.x / d);
    } else {
        start = vec4(1.0, 0.0, 0.0, 0.0);
    }
    return qmul(start, q_right);
}

// Path 3: Combined left+right — a "screw" through S³.
// Left action rotates between fibers; simultaneous right action spirals within them.
// This creates a helical path that covers S³ densely over time.
vec4 path_screw(float t, float left_speed, float right_speed) {
    vec4 q_left  = vec4(sin(t * left_speed),  0.0, 0.0, cos(t * left_speed));
    vec4 q_right = vec4(0.0, sin(t * right_speed), 0.0, cos(t * right_speed));
    return normalize(qmul(q_left, q_right));
}

// Path 4: Geodesic between two quaternions.
// SLERP: the shortest great-circle arc in S³.
vec4 qslerp(vec4 a, vec4 b, float t) {
    float d = dot(a, b);
    // Take the short arc
    if (d < 0.0) { b = -b; d = -d; }
    if (d > 0.9995) return normalize(mix(a, b, t)); // near-parallel: lerp
    float omega = acos(d);
    return (sin((1.0 - t) * omega) * a + sin(t * omega) * b) / sin(omega);
}

// Path 5: Figure-eight in S³ (passes through identity twice per period).
vec4 path_figure_eight(float t) {
    float a = sin(t);
    float b = sin(2.0 * t) * 0.5;
    return normalize(vec4(a, b, 0.0, cos(t)));
}

// ─── Projection ───────────────────────────────────────────────────────────────

// Standard stereographic: S³ \ {(0,0,0,1)} → R³
vec3 stereo(vec4 p) {
    float d = 1.0 - p.w;
    return abs(d) > 0.001 ? p.xyz / d : vec3(1e6);
}

// Camera-space transform: given a 4D point, apply navigation quaternion q
// then project. nav_q represents "where we are" in S³.
vec3 navigate_and_project(vec4 p, vec4 nav_q) {
    return stereo(qmul(nav_q, p));
}
