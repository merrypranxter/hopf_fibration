// S² → Color Mappings for Hopf Fiber Visualization
// ─────────────────────────────────────────────────────────────────────────────
// A color map on S² assigns a color to every point on the base sphere.
// Each Hopf fiber then inherits the color of its base point.
// The choice of color map determines what structure is visually salient.
//
// Five color maps are implemented here:
//   1. LONGITUDE_HUE   — hue = longitude, sat/val vary with latitude
//   2. POLAR           — color by polar angle only (north/south emphasis)
//   3. FOUR_COLOR      — hemisphere-based quad coloring
//   4. DEPTH_BLEND     — blend with 4D projection depth
//   5. FIBER_PHASE     — color by fiber parameter t (requires passing t in)
//
// Usage: call the desired s2_color_* function with the base S² point.
// ─────────────────────────────────────────────────────────────────────────────

#define PI  3.14159265358979
#define TAU 6.28318530717959

// ─── Helper: HSV → RGB ────────────────────────────────────────────────────────

vec3 hsv2rgb(float h, float s, float v) {
    vec3 rgb;
    float hh = fract(h) * 6.0;
    float c  = v * s;
    float x  = c * (1.0 - abs(mod(hh, 2.0) - 1.0));
    float m  = v - c;

    if      (hh < 1.0) rgb = vec3(c, x, 0.0);
    else if (hh < 2.0) rgb = vec3(x, c, 0.0);
    else if (hh < 3.0) rgb = vec3(0.0, c, x);
    else if (hh < 4.0) rgb = vec3(0.0, x, c);
    else if (hh < 5.0) rgb = vec3(x, 0.0, c);
    else               rgb = vec3(c, 0.0, x);

    return rgb + m;
}

// ─── 1. Longitude–Hue (default) ───────────────────────────────────────────────
// Hue follows longitude: as you walk around the equator, all colors cycle once.
// Saturation and brightness vary with latitude: poles are pale, equator is vivid.
// This is the "natural" Hopf coloring — the Villarceau tori show as rainbow bands.

vec3 s2_color_longitude(vec3 p) {
    float lon = atan(p.y, p.x);       // [-π, π]
    float lat = asin(clamp(p.z, -1.0, 1.0)); // [-π/2, π/2]

    float hue = lon / TAU + 0.5;      // [0, 1]
    float sat = 0.5 + 0.5 * cos(lat * 2.0);
    float val = 0.75 + 0.25 * cos(lat);

    return hsv2rgb(hue, sat, val);
}

// ─── 2. Polar Gradient ────────────────────────────────────────────────────────
// Color by polar angle only (colatitude from north pole).
// Every fiber over a latitude circle gets the same color.
// This makes the Villarceau tori clearly visible as solid-colored shells.

vec3 s2_color_polar(vec3 p) {
    float colatitude = acos(clamp(p.z, -1.0, 1.0)) / PI; // [0, 1]

    // Cold (blue) at north pole → warm (orange/red) at south pole
    vec3 cold = vec3(0.2, 0.5, 1.0);
    vec3 warm = vec3(1.0, 0.4, 0.1);
    vec3 mid  = vec3(0.2, 0.9, 0.4);

    float t = colatitude;
    if (t < 0.5) return mix(cold, mid, t * 2.0);
    return mix(mid, warm, (t - 0.5) * 2.0);
}

// ─── 3. Four-Color Hemispheres ────────────────────────────────────────────────
// Assign four distinct colors by octant (sign of x, y, z).
// Reveals the linking between fibers over adjacent hemispheres.
// Two linked fibers get different colors if their base points are in different octants.

vec3 s2_color_four(vec3 p) {
    // Longitude quadrant: [0,π/2), [π/2,π), [π,3π/2), [3π/2,2π)
    float lon = atan(p.y, p.x) / TAU + 0.5; // [0,1]
    float lat = p.z;

    int quad = int(lon * 4.0) % 4;
    float brightness = 0.65 + 0.35 * lat; // brighter near north

    vec3 colors[4];
    colors[0] = vec3(1.0, 0.3, 0.3);  // red
    colors[1] = vec3(0.3, 1.0, 0.5);  // green
    colors[2] = vec3(0.3, 0.6, 1.0);  // blue
    colors[3] = vec3(1.0, 0.9, 0.2);  // yellow

    return colors[quad] * brightness;
}

// ─── 4. Depth Blend ───────────────────────────────────────────────────────────
// Mix the base S² color with a depth color derived from the 4D w-coordinate.
// Fibers deep in the fourth dimension (large |w|) appear cooler/darker.
// Requires the original S³ point p4 in addition to the S² base.

vec3 s2_color_depth(vec3 s2_base, vec4 s3_point) {
    vec3 base_col = s2_color_longitude(s2_base);

    // w-coordinate encodes "fourth-dimensional depth"
    float depth = abs(s3_point.w); // [0, 1]

    // Blend toward a deep indigo for high w
    vec3 deep_col = vec3(0.1, 0.05, 0.3);
    return mix(base_col, deep_col, depth * 0.7);
}

// ─── 5. Fiber Phase ───────────────────────────────────────────────────────────
// Color by the fiber parameter t ∈ [0, 2π].
// Every point on a given circle gets a different hue.
// Use this to visualize that fibers are circles, not points.
// (Normally fibers get one color; this makes the circularity visible.)

vec3 s2_color_phase(vec3 s2_base, float fiber_t) {
    float base_hue = atan(s2_base.y, s2_base.x) / TAU + 0.5;
    float phase_hue = fiber_t / TAU;

    // Blend base hue with phase hue
    float final_hue = mix(base_hue, phase_hue, 0.5);
    float sat = 0.8;
    float val = 0.7 + 0.3 * cos(fiber_t);

    return hsv2rgb(final_hue, sat, val);
}

// ─── 6. Linking Highlight ─────────────────────────────────────────────────────
// Color a specific fiber and all fibers linked to it with a highlight.
// All fibers are linked to all others (linking = 1), so this highlights
// the entire fibration relative to a chosen reference fiber.
// "Distance" here is angular distance on S² between base points.

vec3 s2_color_linked(vec3 s2_base, vec3 s2_reference) {
    float angular_dist = acos(clamp(dot(s2_base, s2_reference), -1.0, 1.0));
    float proximity = 1.0 - angular_dist / PI; // 1 = same fiber, 0 = antipodal

    // Reference fiber: bright white-gold
    vec3 ref_col = vec3(1.0, 0.95, 0.7);
    // Other fibers: colored by longitude but desaturated
    vec3 base_col = s2_color_longitude(s2_base) * 0.5;

    // Blend toward reference color for nearby fibers
    return mix(base_col, ref_col, pow(proximity, 4.0));
}
