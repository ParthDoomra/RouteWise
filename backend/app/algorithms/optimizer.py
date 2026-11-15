"""End-to-End Route Optimization Module.

Why this module exists:
This is the master coordinator for the RouteWise Route Optimization Engine.
It ties together:
1. Haversine distance calculations (haversine.py) or external road matrices (OSRM).
2. Initial tour construction via Nearest Neighbor (nearest_neighbor.py).
3. Local search route untangling via 2-opt (two_opt.py).

It provides a clean function `optimize_route(points, return_to_depot=True, matrix=None)`
that returns complete telemetry: ordered indices, distance before and after,
improvement percentage, execution runtime, and the distance source.

Handling Road Distance Asymmetry:
Road networks are directed / asymmetric (d[i][j] != d[j][i]) due to one-way streets,
divided highways, and turn restrictions.
However, 2-opt fundamentally relies on distance symmetry: when a subsegment is reversed,
2-opt assumes internal edge distances do not change, enabling an O(1) swap evaluation
using only boundary edges.
To solve this:
1. A symmetric matrix is constructed for search: (d[i][j] + d[j][i]) / 2.0.
2. Nearest Neighbor and 2-opt search on this symmetric matrix to find the optimal order.
3. The true total route distance is computed using the real directed distances along
   the final tour order.
"""

import time
from typing import Any, Dict, List, Optional, Tuple

from app.algorithms.haversine import build_distance_matrix, haversine_km
from app.algorithms.nearest_neighbor import nearest_neighbor
from app.algorithms.two_opt import calculate_route_distance, two_opt


def optimize_route(
    points: List[Tuple[float, float]],
    return_to_depot: bool = True,
    matrix: Optional[List[List[float]]] = None,
    distance_matrix: Optional[List[List[float]]] = None,
    distance_source: Optional[str] = None,
) -> Dict[str, Any]:
    """Optimize the delivery sequence for a list of geographic stops.

    points[0] is strictly treated as the depot (warehouse / starting point).
    points[1..N-1] are the customer delivery stops.

    Args:
        points: List of (latitude, longitude) tuples in decimal degrees.
                points[0] is the starting depot.
        return_to_depot: Whether the vehicle returns to the depot at the end of the route.
                         Defaults to True.
        matrix: Optional precomputed N x N pairwise distance matrix in kilometers.
        distance_matrix: Alias for `matrix` for backwards/parameter flexibility.
        distance_source: Optional name of the matrix source (e.g. "osrm", "haversine").
                         Defaults to "haversine" if no matrix is passed.

    Returns:
        A dictionary containing:
        - "order": List of integer indices indicating the optimal visit sequence.
        - "total_km": Final route distance in kilometers after 2-opt optimization (directed).
        - "nearest_neighbor_km": Route distance in kilometers before 2-opt (directed).
        - "improvement_percent": Percentage reduction in distance achieved by 2-opt.
        - "runtime_ms": Total wall-clock execution time in milliseconds.
        - "distance_source": The distance provider source ("osrm", "haversine", etc.).
    """
    start_time = time.perf_counter()
    n = len(points)

    # Resolve precomputed matrix if provided
    raw_matrix = matrix if matrix is not None else distance_matrix
    if raw_matrix is not None:
        directed_matrix = raw_matrix
        source = distance_source or "precomputed"
    else:
        directed_matrix = build_distance_matrix(points)
        source = distance_source or "haversine"

    # -------------------------------------------------------------------------
    # Edge Case 1: 0 stops (empty list)
    # -------------------------------------------------------------------------
    if n == 0:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "order": [],
            "total_km": 0.0,
            "nearest_neighbor_km": 0.0,
            "improvement_percent": 0.0,
            "runtime_ms": round(elapsed_ms, 3),
            "distance_source": source,
        }

    # -------------------------------------------------------------------------
    # Edge Case 2: 1 stop (only the depot)
    # -------------------------------------------------------------------------
    if n == 1:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "order": [0],
            "total_km": 0.0,
            "nearest_neighbor_km": 0.0,
            "improvement_percent": 0.0,
            "runtime_ms": round(elapsed_ms, 3),
            "distance_source": source,
        }

    # -------------------------------------------------------------------------
    # Edge Case 3: 2 stops (depot + exactly 1 delivery stop)
    # There is only one possible visit order: depot (0) -> stop (1).
    # -------------------------------------------------------------------------
    if n == 2:
        if raw_matrix is not None and len(directed_matrix) >= 2 and len(directed_matrix[0]) >= 2:
            d01 = directed_matrix[0][1]
            d10 = directed_matrix[1][0]
            total_dist = (d01 + d10) if return_to_depot else d01
        else:
            dist_between = haversine_km(
                points[0][0], points[0][1],
                points[1][0], points[1][1],
            )
            total_dist = (2.0 * dist_between) if return_to_depot else dist_between

        total_dist_rounded = round(total_dist, 2)
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "order": [0, 1],
            "total_km": total_dist_rounded,
            "nearest_neighbor_km": total_dist_rounded,
            "improvement_percent": 0.0,
            "runtime_ms": round(elapsed_ms, 3),
            "distance_source": source,
        }

    # -------------------------------------------------------------------------
    # General Case: 3 or more stops
    # -------------------------------------------------------------------------

    # Step 1: Build symmetric matrix for heuristic search.
    # Road distances are asymmetric because of one-way streets, ramps, and turn bans:
    # d[i][j] != d[j][i].
    # Standard 2-opt assumes symmetry: reversing subsegment [i..j] assumes the internal
    # distance is invariant, enabling O(1) swap evaluation using only the 2 boundary edges.
    # In an asymmetric matrix, reversing a subsegment reverses the direction of all internal
    # edges, breaking the O(1) evaluation.
    # Therefore, we average d[i][j] and d[j][i] to build a symmetric search matrix for the
    # heuristics (NN and 2-opt), then compute the final reported distance using the true
    # directed distances along the final route order.
    search_matrix: List[List[float]] = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i == j:
                search_matrix[i][j] = 0.0
            else:
                search_matrix[i][j] = (directed_matrix[i][j] + directed_matrix[j][i]) / 2.0

    # Step 2: Phase 1 - Greedy Nearest Neighbor construction heuristic on symmetric matrix
    nn_route = nearest_neighbor(search_matrix, start=0)
    # Evaluate initial tour distance using real directed distances
    nn_distance = calculate_route_distance(nn_route, directed_matrix, return_to_depot=return_to_depot)

    # Step 3: Phase 2 - 2-opt local search improvement on symmetric matrix
    optimized_route = two_opt(nn_route, search_matrix, return_to_depot=return_to_depot)
    # Evaluate final tour distance using real directed distances
    final_distance = calculate_route_distance(optimized_route, directed_matrix, return_to_depot=return_to_depot)

    # Safety safeguard: on heavily skewed asymmetric networks, ensure the optimized route
    # is never worse than the initial nearest neighbor route in directed distance
    if final_distance > nn_distance:
        optimized_route = list(nn_route)
        final_distance = nn_distance

    # Step 4: Calculate performance metrics
    if nn_distance > 1e-9 and nn_distance > final_distance:
        improvement = ((nn_distance - final_distance) / nn_distance) * 100.0
    else:
        improvement = 0.0

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "order": optimized_route,
        "total_km": round(final_distance, 2),
        "nearest_neighbor_km": round(nn_distance, 2),
        "improvement_percent": round(improvement, 2),
        "runtime_ms": round(elapsed_ms, 3),
        "distance_source": source,
    }
