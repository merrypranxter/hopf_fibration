# Fiber Parametrization

## The Hopf Map

The Hopf map h : S³ → S² sends a unit quaternion (x, y, z, w) ∈ ℝ⁴ to:

```
h(x, y, z, w) = ( 2(xz + yw),  2(yz − xw),  x² + y² − z² − w² )
```

Every point on S² has exactly one preimage fiber, which is a great circle on S³.

---

## The Fiber as a Great Circle

For a base point **p** = (p₁, p₂, p₃) on S², the fiber h⁻¹(**p**) is:

```
t ↦ cos(t) · u + sin(t) · v,    t ∈ [0, 2π)
```

where **u** and **v** are orthonormal vectors in ℝ⁴ that span the fiber plane.

### Explicit Formulas for u and v

Let `D = √(2(1 + p₃))`.

**General case** (p₃ ≠ −1, i.e., D > 0):

```
u = (  0,          (1 + p₃)/D,   −p₂/D,      p₁/D  )
v = (  D/2,         0,            p₁/D,       p₂/D  )
```

**Verification**: one can confirm that h(u) = (p₁, p₂, p₃) and h(v) = (p₁, p₂, p₃),
that ⟨u, u⟩ = ⟨v, v⟩ = 1, and that ⟨u, v⟩ = 0, so the parametrization indeed
traces a unit-speed great circle lying entirely within h⁻¹(**p**).

**GLSL implementation** (from the shaders):

```glsl
float denom = sqrt(2.0 * (1.0 + p3));
vec4 u, v;
if (denom > 0.001) {
    u = vec4(0.0, (1.0 + p3) / denom, -p2 / denom,  p1 / denom);
    v = vec4(denom / 2.0,        0.0,  p1 / denom,  p2 / denom);
} else {
    // South pole special case — see below
    u = vec4(0.0, 0.0, 1.0, 0.0);
    v = vec4(0.0, 0.0, 0.0, 1.0);
}
```

---

## Special Case: The South Pole p₃ = −1

When **p** = (0, 0, −1) the formula for D collapses (D = 0).  The fiber at
the south pole is:

```
t ↦ ( 0,  0,  cos(t),  sin(t) )
```

spanned by **u** = (0, 0, 1, 0) and **v** = (0, 0, 0, 1).

**Verification**: h(0,0,cos t, sin t) = (0, 0, 0+0−cos²t−sin²t) = (0,0,−1) ✓

This fiber contains the point (0,0,0,1), which is the north pole of S³ —
the stereographic projection point.  Consequently its image under standard
stereographic projection is a **line** (the w-axis extended to infinity) rather
than a bounded circle.  In any shader using the standard pole (0,0,0,1), this
fiber manifests as a straight line through the origin along the z-axis of ℝ³.

---

## Why the Fiber is a Great Circle on S³

The set `{cos(t)·u + sin(t)·v : t ∈ [0, 2π)}` lies in the 2-plane spanned
by **u** and **v**, and every point has norm 1 (since u, v are orthonormal).
The intersection of S³ with any 2-plane through the origin is a great circle;
the fiber is exactly such an intersection.

---

## Stereographic Image: Circle (or Line) in ℝ³

Under stereographic projection σ : S³ \ {north pole} → ℝ³, great circles
map to circles or lines in ℝ³:

- **Generic fiber**: projects to a Villarceau circle on a Clifford torus.
- **Fiber through the north pole** (0, 0, 0, 1): one point maps to infinity,
  so the image is a line (a "circle of infinite radius").
- **Core fiber** (the equator fiber at the south pole in S²): projects to a
  circle centered at the origin.

The celebrated property of the Hopf fibration is that **any two distinct
fibers are linked with linking number 1**.  This is visible in the
stereographic image: pick any two circles in the projected picture and one
passes through the interior of the other exactly once.

---

## Relationship to the Quaternion Picture

Identifying ℝ⁴ ≅ ℍ (quaternions), the fiber over **p** is a left coset of
the circle subgroup U(1) ⊂ SU(2) ≅ S³.  Left multiplication by a unit
quaternion q permutes fibers (it is an isometry of the fibration), while
right multiplication also permutes them with a different symmetry.  This is
the group-theoretic underpinning of the S³ × S³ → SO(4) isomorphism.
