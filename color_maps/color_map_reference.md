# Color Map Reference

## Why Color Matters

The Hopf fibration has no natural "special" direction in S³. Color is how we impose structure on an inherently symmetric object — and the choice of color map reveals different aspects of the geometry.

## Implemented Maps

### 1. Longitude–Hue (default)

**File**: `s2_color_longitude` in `s2_color.glsl`

Hue follows longitude on S²: a full color cycle around the equator. Saturation and value vary with latitude.

**What it reveals**: As you watch the animated fibration, colors cycle continuously across the Villarceau tori. The rainbow banding shows that each nested torus is swept out by fibers over a single latitude circle.

**Best used with**: `_standard_stereo.frag`, `_quaternion_orbit.frag`

---

### 2. Polar Gradient

**File**: `s2_color_polar` in `s2_color.glsl`

Color by colatitude only: blue at the north pole, green at the equator, orange/red at the south pole.

**What it reveals**: The torus shells. All fibers over a latitude circle share one color, so each nested torus appears as a solid-colored band. This is the clearest way to see the Villarceau circle structure.

**Best used with**: `_dense_glass.frag` (the torus shells are highlighted)

---

### 3. Four-Color Hemispheres

**File**: `s2_color_four` in `s2_color.glsl`

Divide S² into four longitudinal quadrants: red, green, blue, yellow.

**What it reveals**: Linking relationships. Any two fibers from adjacent quadrants pass through each other's sectors. The four-coloring makes the interleaving of linked circles visually explicit.

**Best used with**: `_standard_stereo.frag` (50–70 fibers, each quadrant clearly populated)

---

### 4. Depth Blend

**File**: `s2_color_depth` in `s2_color.glsl`

Modulates the base color with the 4D depth (the w-coordinate of the S³ point). Points with large |w| — deep in the fourth dimension — appear cooler and darker.

**What it reveals**: The fourth dimension directly. After stereographic projection, w-depth correlates with proximity to the projection pole. Fibers near the pole get pulled toward infinity, and their colors fade to indigo.

**Best used with**: `_rotating_projection.frag` (projection pole moves, w-depth changes dynamically)

---

### 5. Fiber Phase

**File**: `s2_color_phase` in `s2_color.glsl`

Mix the fiber's base color with a hue that depends on the fiber parameter t.

**What it reveals**: That fibers are circles, not points. Normally a fiber gets one flat color. With phase coloring, each point on the circle has a distinct hue, making the circular structure of each fiber visible.

**Note**: This requires passing `fiber_t` to the color function, so it's slightly more complex to integrate. See `_quaternion_orbit.frag` for the integration pattern.

---

### 6. Linking Highlight

**File**: `s2_color_linked` in `s2_color.glsl`

Choose a reference base point on S². All fibers near that reference are highlighted white-gold; distant fibers are desaturated.

**What it reveals**: The "field of links" around a chosen fiber. Every fiber is linked to every other, but visually you can emphasize a local neighborhood. Useful for explaining the concept of linking to newcomers.

---

## Extending the Color System

The canonical pipeline is:

```
s2_point → s2_color_*(s2_point) → fiber gets that color
```

For richer visualizations, break the pipeline at either end:

**Pre-color**: Perturb the s2_point before coloring (e.g., add noise, apply a Möbius transformation on S²) to create distorted color patterns.

**Post-color**: Apply a tone-mapping curve (ACES, Reinhard) to the final accumulated color for HDR scenes.

**Animated color**: Add `u_time` as a parameter to any color function to animate the color map independently of the geometry.

---

*The color map is a choice. It imposes meaning on S² — it doesn't change the topology. The linking numbers are the same no matter what colors you choose.*
