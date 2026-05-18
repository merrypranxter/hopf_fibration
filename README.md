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

## Current Views

- [x] _standard_stereo — classic stereographic projection, nested tori, 60 fibers
- [x] _dense_glass — 150 fibers, glass-like transparency, density gradient
- [x] _rotating_projection — moving projection point, fibers flow through infinity
- [x] _quaternion_orbit — navigating S³ via quaternion multiplication

## Directory Guide

| Directory | Contents |
|---|---|
| `shaders/` | Self-contained GLSL fragment shaders. Each file is a complete WebGL visualization of the fibration with a different projection or navigation strategy. |
| `fibers/` | Fiber parametrization derivation (`parametrization.md`) and a Python script (`linking.py`) that numerically verifies the linking number = 1 property via the Gauss integral. |
| `projections/` | Analysis of the different stereographic projection choices and what each reveals geometrically (`analysis.md`). |
| `navigation/` | Quaternion rotation theory (`quaternion_rotation.md`) and GLSL helper functions for smooth paths through S³ (`camera_paths.glsl`). |
| `color_maps/` | GLSL color functions keyed to S² base points, 4D depth, and fiber direction (`s2_to_rgb.glsl`), with a guide to what each scheme reveals geometrically (`color_schemes.md`). |

## Mathematical Reference

### Hopf Map
```
h: S³ → S²
h(x, y, z, w) = (2(xz + yw), 2(xw − yz), x² + y² − z² − w²)
```

### Stereographic Projection
```
S³ \ {(0,0,0,1)} → R³
(x, y, z, w) ↦ (x, y, z) / (1 - w)
```

### Fiber Parametrization
For a point `(p₁, p₂, p₃)` on S², the fiber is:
```
t ↦ (cos(t) · u + sin(t) · v)
```
where `u` and `v` are orthonormal vectors in the fiber plane.

## References

- Hopf, H. (1931). "Über die Abbildung der dreidimensionalen Sphäre auf die Kugelfläche." *Mathematische Annalen*, 104, 637-665.
- Thurston, W. *Three-Dimensional Geometry and Topology*, Princeton University Press.
- Niles Johnson's Hopf fibration visualizations (excellent pedagogical resource).

---

*Every fiber is a circle. Every pair of fibers is linked. This is not metaphor. This is S³.*
