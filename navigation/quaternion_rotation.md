# Quaternion Rotation in S³

## S³ as the Unit Quaternion Group

The 3-sphere S³ ⊂ ℝ⁴ is identified with the group of unit quaternions:

```
S³ = { w + xi + yj + zk  :  w² + x² + y² + z² = 1 }
```

stored as `vec4(x, y, z, w)` in GLSL.  Quaternion multiplication makes S³ a
Lie group, the simply-connected double cover of SO(3).

---

## Left and Right Actions on S³

### Left Action

Given a unit quaternion q ∈ S³, **left multiplication** sends:

```
p  ↦  p' = q * p
```

This is an orientation-preserving isometry of S³.  Crucially, it **preserves
the Hopf fibration**: if p and p + δ lie on the same fiber, so do q*p and
q*(p + δ).  Left multiplication permutes fibers among themselves, so it
descends to an isometry of the base S².

*Visual effect*: the entire bundle of nested tori rotates and flows, but the
linking of every pair of fibers is preserved.

### Right Action

**Right multiplication** sends:

```
p  ↦  p'' = p * q
```

This is a *different* isometry of S³, also preserving the fibration (since
the Hopf fibration is bi-invariant under S³ × S³ acting by
p ↦ q_L * p * q_R).

*Visual effect*: a different "axis" of rotation through S³, yielding a
qualitatively different camera path.

### Combined Action

The map (q_L, q_R) ↦ (p ↦ q_L * p * q_R) gives a homomorphism

```
S³ × S³  →  SO(4)
```

whose kernel is {(1,1), (−1,−1)}, proving SO(4) ≅ (S³ × S³) / ℤ₂.  This
double action is what the `_quaternion_orbit` shader exploits.

---

## Smooth Paths Through S³: Great Circle Arcs

The geodesics on S³ (with round metric) are great circles.  Given two points
p₀, p₁ ∈ S³, the arc is:

```
p(t) = cos(t) * p₀ + sin(t) * p₁,    t ∈ [0, π]
```

when p₀ ⊥ p₁.  For general p₀, p₁, use **SLERP** (spherical linear
interpolation):

```
p(t) = slerp(p₀, p₁, t) = sin((1−t)Ω)/sin(Ω) * p₀ + sin(tΩ)/sin(Ω) * p₁
```

where Ω = arccos(⟨p₀, p₁⟩) is the geodesic distance.

---

## S³ × S³ → SO(4)

Any rotation of ℝ⁴ can be written as p ↦ q_L * p * q_R⁻¹ for some
(q_L, q_R) ∈ S³ × S³.  Special cases:

| Action | Effect on fibers |
|---|---|
| q_L = q, q_R = 1 | Rotates S² base, shifts fibers |
| q_L = 1, q_R = q | Different rotation of S², shifts fibers |
| q_L = q_R = q     | Rotates ℝ³ ⊂ ℝ⁴ (lifts to SO(3) ⊂ SO(4)) |

---

## GLSL Snippet: Quaternion Multiplication

```glsl
// Quaternions stored as vec4(x, y, z, w) = xi + yj + zk + w
vec4 qmul(vec4 a, vec4 b) {
    return vec4(
        a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz),
        a.w * b.w   - dot(a.xyz, b.xyz)
    );
}
```

To apply a left action, use `qmul(q, p)`.  To apply a right action, use
`qmul(p, q)`.  Always `normalize()` after several multiplications to
counteract floating-point drift.
