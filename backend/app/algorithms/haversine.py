"""Haversine Distance & Distance Matrix Module.

Why this module exists:
In route optimization, we constantly need to know the distance between stops.
However, delivery coordinates are given in latitude and longitude degrees.
Because the Earth is a curved sphere (oblate spheroid), we CANNOT use simple
Euclidean distance (Pythagorean theorem: sqrt(dx^2 + dy^2)). Doing so would cause
severe spatial distortion because 1 degree of longitude shrinks significantly as
you move away from the equator towards the poles.

The Haversine formula calculates the true great-circle distance between two
points on a sphere given their latitudes and longitudes.

Viva Explanation:
"Why Haversine?"
- Standard Euclidean math assumes a flat 2D plane. But Earth is spherical.
- The Haversine formula calculates the shortest distance over the Earth's surface
  using spherical trigonometry.
- Earth's mean radius is taken as 6,371.0 kilometers (recommended by the
  International Union of Geodesy and Geophysics).

"Why precompute a Distance Matrix?"
- Calculating Haversine distance requires multiple trigonometric calls:
  sin, cos, and atan2. These are CPU-heavy operations.
- If we computed distances on-the-fly inside our optimization loops (Nearest
  Neighbor and 2-opt), we would recalculate the distance between the same two
  locations thousands of times.
- By precomputing an N x N symmetric distance matrix once in O(N^2) time, every
  subsequent distance lookup becomes an instant O(1) memory lookup!
"""

import math
from typing import List, Tuple

# Mean radius of Earth in kilometers (WGS-84 volumetric mean)
EARTH_RADIUS_KM: float = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate the great-circle distance between two geographic coordinates in kilometers.

    Formula:
        a = sin²(Δlat / 2) + cos(lat1) * cos(lat2) * sin²(Δlng / 2)
        c = 2 * atan2(√a, √(1 - a))
        distance = R * c

    Args:
        lat1: Latitude of first point in decimal degrees.
        lng1: Longitude of first point in decimal degrees.
        lat2: Latitude of second point in decimal degrees.
        lng2: Longitude of second point in decimal degrees.

    Returns:
        Great-circle distance between the two points in kilometers.
    """
    # Step 1: Handle identical coordinates immediately.
    # If the origin and destination are the exact same point, distance is 0.0.
    # Short-circuiting avoids subtle floating-point errors (e.g. 1e-16).
    if lat1 == lat2 and lng1 == lng2:
        return 0.0

    # Step 2: Convert latitude and longitude from degrees to radians.
    # Python's math trigonometric functions (sin, cos) strictly expect radians.
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    # Step 3: Compute the Haversine of the central angle (a).
    # 'a' represents the square of half the chord length between the points.
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )

    # Step 4: Numerical safety clamping.
    # Due to floating point imprecision, 'a' could occasionally evaluate to 1.0000000000000002
    # for antipodal points, which would cause math.sqrt(1 - a) to crash with domain error.
    a = max(0.0, min(1.0, a))

    # Step 5: Compute the angular distance in radians (c).
    # We use atan2 instead of asin because atan2 is numerically stable across all angles.
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    # Step 6: Multiply angular distance by Earth's mean radius to get kilometers.
    return EARTH_RADIUS_KM * c


def build_distance_matrix(points: List[Tuple[float, float]]) -> List[List[float]]:
    """Build a complete, symmetric pairwise distance matrix for a list of coordinates.

    Given N points [(lat_0, lng_0), (lat_1, lng_1), ..., (lat_N-1, lng_N-1)],
    returns an N x N 2D list where matrix[i][j] is the distance in km from point i to point j.

    Why symmetric:
    On a sphere, distance from point A to point B is identical to distance from point B to point A.
    Therefore, matrix[i][j] == matrix[j][i], and matrix[i][i] == 0.0.
    We exploit this symmetry to calculate only N * (N - 1) / 2 distances instead of N^2,
    cutting computation time in half.

    Args:
        points: List of (lat, lng) tuples.

    Returns:
        A 2D list (matrix) of floats where element [i][j] is distance in km.
    """
    n = len(points)
    if n == 0:
        return []

    # Initialize an N x N matrix with 0.0 for all entries
    matrix: List[List[float]] = [[0.0] * n for _ in range(n)]

    # Populate upper triangle and mirror to lower triangle
    for i in range(n):
        lat1, lng1 = points[i]
        for j in range(i + 1, n):
            lat2, lng2 = points[j]
            dist = haversine_km(lat1, lng1, lat2, lng2)
            matrix[i][j] = dist
            matrix[j][i] = dist

    return matrix
