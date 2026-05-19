# hopf_fibration

A creative coding project visualizing the Hopf fibration — the most beautiful map in topology, from the 3-sphere to the 2-sphere, with linked circular fibers.

## What This Is

Not "trippy torus knots" or generic math art. This project renders the **actual Hopf fibration**: S³ → S², where every point on the 2-sphere corresponds to a circle in the 3-sphere, and every pair of circles is linked exactly once.

The visualization is through stereographic projection: S³ (minus a point) → R³. The fibers become nested Villarceau circles on nested tori.

## Project Structure

```
shaders/          # GLSL fragments — projection and fiber rendering
fibers/           # Parametric fiber definitions, linking analysis
projections/      # Stereographic variants: standard, antipodal, animated
navigation/       # Quaternion rotations in S³, camera paths through 4D
color_maps/       # S² → color mappings, fiber coloring by base point
```

## Running

Shaders are self-contained GLSL fragment shaders with 4D math. Run in any WebGL environment (Shadertoy, Three.js, custom).

Required uniforms for all shaders:
- `u_resolution` — `vec2` canvas size in pixels
- `u_time` — `float` elapsed seconds (drives animation)

## Current Views

- [x] `_standard_stereo` — classic stereographic projection, nested tori, 60 fibers
- [x] `_dense_glass` — 150 fibers, glass-like transparency, density gradient
- [x] `_rotating_projection` — moving projection pole, fibers flow through infinity
- [x] `_quaternion_orbit` — navigating S³ via quaternion left/right action

## Library Files

| File | Purpose |
|---|---|
| `fibers/fibers.glsl` | Fiber parametrization, Hopf map, quaternion math (include in shaders) |
| `fibers/linking.md` | Algebraic and numerical proof that lk = 1 for every pair of fibers |
| `navigation/quaternion_camera.glsl` | S³ camera paths, SLERP, left/right quaternion actions |
| `navigation/camera_paths.md` | Reference: how to navigate S³ and what each path reveals |
| `color_maps/s2_color.glsl` | Six S² → color mappings (longitude, polar, four-color, depth, phase, linking) |
| `color_maps/color_map_reference.md` | When to use each color map and what it reveals |
| `projections/analysis.md` | Comparison of stereographic variants and their visual effects |

## Mathematical Reference

### Hopf Map
```
h: S³ → S²
h(x, y, z, w) = (2(xz + yw), 2(yz - xw), x² + y² - z² - w²)
```

### Stereographic Projection
```
S³ \ {(0,0,0,1)} → R³
(x, y, z, w) ↦ (x, y, z) / (1 - w)
```

### Fiber Parametrization
For a point `(p₁, p₂, p₃)` on S², the fiber is:
```
t ↦ cos(t) · u + sin(t) · v
```
where `u` and `v` are orthonormal vectors in the fiber plane (see `fibers/fibers.glsl`).

### Quaternion Left Action
```
S³ acts on S³ by left multiplication: q · p
This induces a rotation R_q ∈ SO(3) on the base S²:
  h(q·p) = R_q · h(p)
```

### Linking Number
```
lk(Fₚ, F_q) = 1   for any two distinct fibers Fₚ, F_q
```
See `fibers/linking.md` for proof.

## References

- Hopf, H. (1931). "Über die Abbildung der dreidimensionalen Sphäre auf die Kugelfläche." *Mathematische Annalen*, 104, 637–665.
- Thurston, W. *Three-Dimensional Geometry and Topology*, Princeton University Press.
- Niles Johnson's Hopf fibration visualizations (excellent pedagogical resource).
- Milnor, J. "On the Total Curvature of Knots." *Annals of Mathematics*, 52 (1950).

---

*Every fiber is a circle. Every pair of fibers is linked. This is not metaphor. This is S³.*
