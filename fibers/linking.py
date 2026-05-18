"""
linking.py — Hopf fibration: fiber parametrization and linking number.

Demonstrates that any two distinct Hopf fibers have linking number exactly 1,
computed numerically via the Gauss linking integral.
"""

import numpy as np


# ---------------------------------------------------------------------------
# Hopf map  h : S³ → S²
#
#   h(x, y, z, w) = (2(xz + yw),  2(xw − yz),  x² + y² − z² − w²)
#
# This convention is consistent with the fiber basis vectors u, v used in
# the shaders: one can verify that h(cos(t)*u + sin(t)*v) = s2_point for all t.
# ---------------------------------------------------------------------------
def hopf_map(p):
    """Return the image of a unit quaternion p = (x,y,z,w) under the Hopf map."""
    x, y, z, w = p
    return np.array([
        2.0 * (x*z + y*w),
        2.0 * (x*w - y*z),
        x**2 + y**2 - z**2 - w**2,
    ])


# ---------------------------------------------------------------------------
# Fiber parametrization
# Given s2_point = (p1, p2, p3) on S², the fiber is  t ↦ cos(t)*u + sin(t)*v.
# ---------------------------------------------------------------------------
def _fiber_basis(s2_point):
    """Return orthonormal vectors u, v ∈ ℝ⁴ spanning the fiber plane."""
    p1, p2, p3 = s2_point
    D = np.sqrt(2.0 * (1.0 + p3))

    if D > 1e-9:
        u = np.array([0.0, (1.0 + p3) / D, -p2 / D,  p1 / D])
        v = np.array([D / 2.0,        0.0,  p1 / D,  p2 / D])
    else:
        # South pole special case: p3 ≈ −1  →  fiber is {(0,0,cos t, sin t)}.
        # Verify: h(0,0,cos t,sin t) = (0, 0, 0+0-cos²t-sin²t) = (0,0,-1) ✓
        # This fiber contains (0,0,0,1) (the stereographic north pole) so its
        # projection is a line in ℝ³ (see parametrization.md, special cases).
        u = np.array([0.0, 0.0, 1.0, 0.0])
        v = np.array([0.0, 0.0, 0.0, 1.0])

    return u, v


def fiber(s2_point):
    """Return a function  t → (x,y,z,w)  parametrizing the Hopf fiber over s2_point."""
    u, v = _fiber_basis(s2_point)

    def curve(t):
        return np.cos(t) * u + np.sin(t) * v

    return curve


# ---------------------------------------------------------------------------
# Stereographic projection  S³ \ {(0,0,0,1)} → ℝ³
# ---------------------------------------------------------------------------
def stereo_project(p):
    """Project a unit quaternion p = (x,y,z,w) to ℝ³."""
    x, y, z, w = p
    denom = 1.0 - w
    if abs(denom) < 1e-9:
        return np.array([1e9, 1e9, 1e9])
    return np.array([x, y, z]) / denom


# ---------------------------------------------------------------------------
# Sample a projected fiber as an array of ℝ³ points.
# Returns (pts, tangents) both of shape (n, 3).
# ---------------------------------------------------------------------------
def sample_projected_fiber(s2_point, n=300):
    """Sample the stereographic image of the Hopf fiber at n equally-spaced angles."""
    gamma = fiber(s2_point)
    ts    = np.linspace(0.0, 2.0 * np.pi, n, endpoint=False)
    pts   = np.array([stereo_project(gamma(t)) for t in ts])
    # Cyclic finite-difference tangents
    tangents = np.roll(pts, -1, axis=0) - pts
    return pts, tangents


# ---------------------------------------------------------------------------
# Gauss linking integral
#
# For two closed curves A[i] (i=0…n-1) and B[j] (j=0…n-1) in ℝ³ with
# tangent vectors dA[i] and dB[j]:
#
#   lk = (1/4π) ∑_i ∑_j  (A_i − B_j) · (dA_i × dB_j)
#                          --------------------------------  dt²
#                             |A_i − B_j|³
# ---------------------------------------------------------------------------
def gauss_linking_number(s2_a, s2_b, n=300):
    """
    Numerically compute the Gauss linking integral of two Hopf fibers in ℝ³.

    Parameters
    ----------
    s2_a, s2_b : array-like, shape (3,)  — unit vectors on S²
    n : int — number of sample points on each fiber

    Returns
    -------
    float — approximate linking number (should be close to ±1 for Hopf fibers)
    """
    A, dA = sample_projected_fiber(s2_a, n)  # (n, 3)
    B, dB = sample_projected_fiber(s2_b, n)  # (n, 3)

    dt = 2.0 * np.pi / n

    # Vectorised double sum using broadcasting
    # diff[i, j] = A[i] - B[j],  shape (n, n, 3)
    diff  = A[:, np.newaxis, :] - B[np.newaxis, :, :]
    r2    = np.sum(diff**2, axis=2)                         # (n, n)
    r3    = (r2 ** 1.5)[:, :, np.newaxis]                  # (n, n, 1)  avoid /0

    # cross[i, j] = dA[i] × dB[j],  shape (n, n, 3)
    cross = np.cross(dA[:, np.newaxis, :], dB[np.newaxis, :, :])

    # integrand[i, j] = diff · cross / |diff|³
    integrand = np.sum(diff * cross / (r3 + 1e-30), axis=2)  # (n, n)

    # dA[i] and dB[j] are finite differences, each ≈ tangent * dt.
    # Their cross product already carries a factor dt², so the double sum
    # is directly an approximation to the double integral — no extra dt² needed.
    lk = np.sum(integrand) / (4.0 * np.pi)
    return lk


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------
def _normalize(v):
    return np.array(v, dtype=float) / np.linalg.norm(v)


def main():
    np.random.seed(42)

    # Verify fiber maps to base point under Hopf map
    def verify_fiber(s2_pt, label):
        gamma = fiber(s2_pt)
        for t in [0.0, 0.5, 1.0, 2.0, 3.5]:
            p  = gamma(t)
            hp = hopf_map(p)
            if not np.allclose(hp, s2_pt, atol=1e-10):
                print(f"  WARNING: h(fiber({label}, {t:.1f})) = {hp}, expected {s2_pt}")
                return False
        return True

    print("Hopf map fiber verification:")
    test_pts = [
        _normalize([1.0,  0.0,  0.0]),
        _normalize([0.0,  1.0,  0.0]),
        _normalize([0.0,  0.0,  1.0]),
        _normalize([0.3,  0.7, -0.3]),
    ]
    for pt in test_pts:
        ok = verify_fiber(pt, str(pt))
        print(f"  {pt}  → {'OK' if ok else 'FAIL'}")

    # Gauss linking numbers for pairs of distinct fibers.
    # Note: the fiber over the S² south pole (0,0,-1) projects to a LINE in ℝ³
    # (it passes through the stereographic north pole), so the Gauss integral
    # diverges for that fiber.  All other pairs give linking number 1.
    pairs = [
        # Equator pair — different longitudes
        (_normalize([1.0, 0.0, 0.0]),   _normalize([0.0, 1.0, 0.0])),
        # North pole and equator
        (_normalize([0.0, 0.0,  1.0]),  _normalize([1.0, 0.0, 0.0])),
        # Two random points
        (_normalize([0.3, 0.7, -0.3]),  _normalize([-0.5, 0.2, 0.8])),
        # Antipodal equator points
        (_normalize([1.0, 0.0, 0.0]),   _normalize([-1.0, 0.0, 0.0])),
    ]

    print("\nGauss linking numbers (exact value: 1 for all pairs)")
    print("=" * 55)
    for idx, (p, q) in enumerate(pairs):
        lk = gauss_linking_number(p, q, n=250)
        print(f"Pair {idx+1}:  A={np.round(p,2)}  B={np.round(q,2)}")
        print(f"  Linking number ≈ {lk:.4f}")


if __name__ == "__main__":
    main()
