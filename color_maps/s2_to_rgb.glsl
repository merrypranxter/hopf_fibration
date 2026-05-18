// s2_to_rgb.glsl
// Color mapping functions for Hopf fibration visualizations.
// Each function encodes a different geometric aspect of S² or S³ as color.
// All functions are self-contained and WebGL 1.0 compatible.

precision highp float;

#define PI  3.14159265358979
#define TAU 6.28318530717959

// ---------------------------------------------------------------------------
// HSV → RGB
// Input:  hsv.x = hue ∈ [0,1), hsv.y = saturation ∈ [0,1], hsv.z = value ∈ [0,1]
// Output: RGB in [0,1]³
// ---------------------------------------------------------------------------
vec3 hsv_to_rgb(vec3 hsv) {
    float h = hsv.x * 6.0;   // [0, 6)
    float s = hsv.y;
    float v = hsv.z;

    float c = v * s;
    float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
    float m = v - c;

    vec3 rgb;
    if      (h < 1.0) rgb = vec3(c, x, 0.0);
    else if (h < 2.0) rgb = vec3(x, c, 0.0);
    else if (h < 3.0) rgb = vec3(0.0, c, x);
    else if (h < 4.0) rgb = vec3(0.0, x, c);
    else if (h < 5.0) rgb = vec3(x, 0.0, c);
    else              rgb = vec3(c, 0.0, x);

    return rgb + m;
}

// ---------------------------------------------------------------------------
// Longitude-latitude color
//
// Encodes the base point's position on S² into hue and saturation:
//   hue        = longitude ∈ [0, 2π) → [0, 1)
//   saturation = varies with latitude: full at the equator, muted at poles
//   value      = slightly brighter near the equator
//
// Geometrically: two fibers with similar colors come from nearby base points.
// The color wraps continuously around S², making the fibration's continuity
// visually obvious.
// ---------------------------------------------------------------------------
vec3 longitude_latitude_color(vec3 s2_point) {
    float lon = atan(s2_point.y, s2_point.x);   // [-π, π]
    float lat = asin(clamp(s2_point.z, -1.0, 1.0)); // [-π/2, π/2]

    float hue = lon / TAU + 0.5;                // [0, 1)
    float sat = 0.6 + 0.4 * cos(lat * 2.0);    // full at equator, reduced at poles
    float val = 0.75 + 0.25 * cos(lat);         // slightly brighter near equator

    return hsv_to_rgb(vec3(hue, sat, val));
}

// ---------------------------------------------------------------------------
// Stereographic color
//
// Projects S² stereographically from the south pole onto a disk in the
// xy-plane, then uses a 2D color wheel to assign color.
//
//   disk_point = (x, y) / (1 + z)   — stereographic projection of S² from south pole
//   hue        = angle of disk_point
//   saturation = radius (saturated at edge, white at center)
//
// Geometrically: the color varies continuously with the S² position, but the
// mapping emphasizes the northern hemisphere (contracted to the unit disk)
// and stretches the southern hemisphere to the exterior.
// ---------------------------------------------------------------------------
vec3 stereographic_color(vec3 s2_point) {
    float denom = 1.0 + s2_point.z;   // projection from south pole (z = -1)
    vec2 disk;
    if (abs(denom) < 1e-4) {
        // At the south pole, assign a fixed color (magenta)
        return vec3(1.0, 0.0, 1.0);
    }
    disk = s2_point.xy / denom;

    float angle  = atan(disk.y, disk.x);        // [-π, π]
    float radius = length(disk);

    float hue = angle / TAU + 0.5;              // [0, 1)
    float sat = 1.0 - exp(-radius * 0.8);       // saturates with distance from center
    float val = 0.85;

    return hsv_to_rgb(vec3(hue, sat, val));
}

// ---------------------------------------------------------------------------
// Depth color
//
// Colors an S³ point by its w-coordinate (the "fourth dimension").
// Warm (red/orange) = high w ≈ near the stereographic projection pole.
// Cool (blue/cyan)  = low w ≈ near the antipodal point.
//
// Geometrically: reveals the 4D structure compressed by stereographic
// projection.  Fibers with high w are stretched outward in ℝ³; fibers with
// low w cluster near the origin.
// ---------------------------------------------------------------------------
vec3 depth_color(vec4 s3_point) {
    // w ∈ [-1, 1] → map to [0, 1]
    float depth = (s3_point.w + 1.0) * 0.5;

    // Interpolate from deep blue (depth=0) through cyan, white, yellow to red (depth=1)
    vec3 cool = vec3(0.1, 0.3, 0.9);   // low w
    vec3 mid  = vec3(0.9, 0.9, 0.9);   // w ≈ 0
    vec3 warm = vec3(1.0, 0.3, 0.1);   // high w

    if (depth < 0.5) {
        return mix(cool, mid, depth * 2.0);
    } else {
        return mix(mid, warm, (depth - 0.5) * 2.0);
    }
}

// ---------------------------------------------------------------------------
// Fiber gradient
//
// Modulates the brightness of a base color along the fiber parameter t ∈ [0, 2π).
// One half of each closed circle is bright; the other is dim.
//
// Geometrically: makes each fiber visually readable as a directed closed curve.
// Without a gradient, overlapping circles in a dense visualization blend together.
// ---------------------------------------------------------------------------
vec3 fiber_gradient(float t, vec3 base_color) {
    // Smooth brightness oscillation around the fiber
    float brightness = 0.4 + 0.6 * ((1.0 + cos(t)) * 0.5);
    return base_color * brightness;
}
