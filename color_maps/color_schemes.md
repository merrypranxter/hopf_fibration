# Color Schemes for the Hopf Fibration

## Overview

Color is not decoration here — it carries geometric information.  Each scheme
reveals a different aspect of the fibration's structure.

---

## Base Point Coloring

**Function**: `longitude_latitude_color(vec3 s2_point)`

**Encoding**: Hue = longitude of the base point on S²; saturation varies with
latitude; value peaks at the equator.

**What it reveals**: Two fibers with similar colors come from nearby points on
S².  Adjacent circles in ℝ³ that are colored alike confirm that the map
h : S³ → S² is continuous — close inputs give close outputs.  The color
gradient wraps around and closes up, reflecting the periodicity of longitude
on S².

**Best for**: Understanding the global structure of the fibration, seeing
which circles belong to the same latitude band (which is a Clifford torus).

---

## Depth Coloring (4D Structure)

**Function**: `depth_color(vec4 s3_point)`

**Encoding**: Color by the w-coordinate of the S³ point.  Warm colors
(red/orange) mean high w (close to the stereographic projection pole);
cool colors (blue/cyan) mean low w (close to the antipodal point).

**What it reveals**: The stereographic projection compresses the w-axis into
apparent depth in ℝ³.  Depth coloring makes this explicit — you can see
the fourth dimension as a temperature.  Fibers near the projection pole
(high w) are stretched outward and appear warm; fibers near the antipode
(w ≈ −1) cluster at the origin and appear cool.

**Best for**: Intuiting the 4D geometry; seeing why the "core circle" sits at
the origin and the "axial line" extends to infinity.

---

## Fiber Gradient

**Function**: `fiber_gradient(float t, vec3 base_color)`

**Encoding**: Modulate brightness along the fiber parameter t ∈ [0, 2π).
One half of the circle is bright; the other is dark.  The transition is
smooth.

**What it reveals**: Each projected circle is a closed curve.  Without a
gradient, a uniform-color circle is visually indistinguishable from a torus
or a sphere.  The brightness gradient makes the "direction of travel" around
each circle visible, turning each fiber into a legible closed loop.

**Best for**: Dense visualizations with many overlapping fibers; making
individual circles readable.

---

## Linking Highlight

**Strategy**: Assign two specific fibers distinct, high-contrast colors
(e.g., bright red and bright white) while rendering all other fibers in muted
grey.

**What it reveals**: Pick any two base points on S², color their fibers
distinctly, and observe that one circle passes through the interior of the
other exactly once in the projected picture.  This is the linking number = 1
property, the central topological fact of the Hopf fibration, made directly
visible.

**How to use it in a shader**:
1. Choose two base points `p_A`, `p_B` on S².
2. In the fiber loop, check `i == A_index` or `i == B_index`.
3. Override `fiber_col` with red or white for those indices.
4. Increase the glow multiplier for those fibers.

**Best for**: Teaching, talks, first-time viewers.  Nothing communicates
"every pair of circles is linked" faster than seeing two specific circles
threaded through each other.

---

## Combining Schemes

The schemes compose naturally:

- **Base point + fiber gradient**: hue encodes which S² neighborhood, brightness
  encodes position along the circle.  Full information with no ambiguity.
- **Depth + fiber gradient**: temperature shows 4D depth, brightness shows
  fiber direction.  Good for the rotating-projection shader where 4D depth
  changes dynamically.
- **Linking highlight + depth**: highlight two fibers with color, shade all
  others by depth — the highlighted pair stands out against a blue-to-warm
  background that shows the 4D embedding.
