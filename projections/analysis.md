# Projection Analysis

## Standard Stereographic
- **Projection point**: (0, 0, 0, 1) — the "north pole" of S³
- **Effect**: The fiber through the projection point becomes a line at infinity. The orthogonal fiber becomes the core circle at the origin.
- **Visual**: Nested tori, dense near the center, sparse at infinity. The linking is clearest here.

## Antipodal Stereographic
- **Projection point**: (0, 0, 0, -1) — the "south pole"
- **Effect**: Swaps which fiber is the line and which is the core circle.
- **Visual**: Same structure, inverted. The core circle is now the one that was at infinity.

## General Point Projection
- **Projection point**: Any point on S³
- **Effect**: The fiber through that point becomes the line at infinity.
- **Visual**: As the projection point moves, different fibers "flow through infinity." This is the most dynamic view.

## Quaternion Rotation
- **Method**: Multiply all S³ points by a unit quaternion before projecting.
- **Effect**: Rotates the entire fibration in 4D.
- **Visual**: The nested tori appear to flow and deform, but the linking is preserved.

## Two-Stage Projection
- **Method**: Project S³ → R³, then apply a 3D camera transform.
- **Effect**: Standard graphics pipeline on the stereographic image.
- **Visual**: Allows flying through the projected space.

## Cylindrical Projection
- **Method**: Map S³ to S² × R (Hopf map gives S², fiber coordinate gives R).
- **Effect**: Unwraps the fibration into a cylinder.
- **Visual**: Each fiber is a horizontal circle. The S² base is the cylinder's cross-section.

---

*The projection choice determines which fiber is "special." But in S³, no fiber is special. The projection is the distortion. The fibration is the truth.*
