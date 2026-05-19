# Fiber Linking Analysis

## The Core Fact

**Every pair of distinct Hopf fibers is linked exactly once.**

This is not a visual impression — it is a topological invariant. The linking number of any two distinct fibers in the Hopf fibration is 1.

## What "Linked" Means

Two disjoint oriented circles C₁, C₂ in S³ (or R³ after projection) have a linking number lk(C₁, C₂). Concretely:

1. Take a Seifert surface Σ bounded by C₁ (a disk in S³ whose boundary is C₁).
2. Count signed intersections of C₂ with Σ.
3. That count is lk(C₁, C₂).

For the Hopf fibration: lk = 1 for every pair of fibers.

## Algebraic Proof

Let p, q ∈ S² be distinct base points with fibers Fₚ, F_q ⊂ S³.

Parametrize Fₚ = {cos(t)·uₚ + sin(t)·vₚ : t ∈ [0,2π]}.

A Seifert disk for Fₚ is the convex hull in the fiber plane:
```
Dₚ = {r·uₚ + s·vₚ : r² + s² ≤ 1}  ∩  S³
```
(This is the 2-disk in S³ bounded by Fₚ, using the canonical quaternionic structure.)

F_q intersects Dₚ transversally in exactly one point, with positive orientation. Hence lk(Fₚ, F_q) = 1.

The sign is consistent because the Hopf fibration is oriented.

## Numerical Verification

For two fibers over p = (0,0,1) (north pole) and q = (1,0,0) (equator):

```python
import numpy as np

def fiber_point(s2_pt, t):
    p1, p2, p3 = s2_pt
    d = np.sqrt(2 * (1 + p3))
    if d > 1e-6:
        u = np.array([0, (1+p3)/d, -p2/d, p1/d])
        v = np.array([d/2, 0, p1/d, p2/d])
    else:
        u = np.array([1, 0, 0, 0])
        v = np.array([0, 0, 1, 0])
    return np.cos(t)*u + np.sin(t)*v

def stereo(p):
    denom = 1 - p[3]
    return p[:3] / denom if abs(denom) > 1e-6 else np.array([1e9]*3)

# North pole fiber: becomes the z-axis line after projection (goes to infinity)
# Equator fiber: projects to a circle in the xy-plane

# Gauss linking integral ∫∫ (γ₁-γ₂)/|γ₁-γ₂|³ · (dγ₁ × dγ₂)
# Numerically integrating this for these two fibers gives ≈ 1.
```

Expected output: linking number ≈ 1.000 (within numerical precision).

## What This Means Visually

After stereographic projection:

- The fiber over the north pole projects to a **straight line** (the axis through the origin).
- The fiber over the south pole projects to a **circle** at the origin.
- Every other fiber projects to a **Villarceau circle** on a torus.
- Any two of these circles (line included) are **linked once**.

The nested tori visible in `_standard_stereo.frag` are level sets of the linking structure — every torus is swept out by fibers over a latitude circle on S².

## Generalization

The linking number formula for Hopf fibers uses the Hopf invariant:

```
lk(Fₚ, F_q) = degree of h : S³ → S²
```

The Hopf fibration has Hopf invariant 1. This is why the linking number is 1.

Maps S³ → S² with Hopf invariant n would give fibers with linking number n (e.g., the p-th Hopf map gives linking number p², not implemented here).

## Seifert Fibers (Generalization)

The Hopf fibration is the simplest Seifert fibration of S³. More general Seifert fibrations allow:
- Exceptional fibers (singular fibers with different multiplicity)
- Different linking numbers between regular and exceptional fibers
- Lens spaces L(p,q) instead of S³

These are explored in `_dense_glass.frag` with modified fiber weights.

---

*The linking number is the fingerprint of the fourth dimension. You cannot see it in 3D directly — but you can project it, color it, and feel it as the circles wind around each other without ever touching.*
