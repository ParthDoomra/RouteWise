"""End-to-End Route Optimization Module.

Why this module exists:
This is the master coordinator for the RouteWise Route Optimization Engine.
It ties together:
1. Haversine distance calculations (haversine.py)
2. Initial tour construction via Nearest Neighbor (nearest_neighbor.py)
3. Local search route untangling via 2-opt (two_opt.py)

It provides a single, clean function `optimize_route(points, return_to_depot=True)`
that returns complete telemetry (ordered indices, distance before and after,
improvement percentage, and execution runtime).

Viva Explanation:
"Why combine Nearest Neighbor and 2-opt?"
- Construction heuristics (Nearest Neighbor) build a feasible route from scratch
  very quickly (O(N^2)), but their greedy nature leaves crossing paths and detours.
- Improvement heuristics (2-opt) cannot build a route from scratch; they need an
  initial route to improve upon.
- By combining both, we get the best of both worlds:
  1. Fast initial route construction from Nearest Neighbor.
  2. Elegant post-processing optimization from 2-opt that eliminates crosses.
- The entire process executes in under 5 milliseconds for typical delivery routes
  (10-30 stops), running entirely in-memory with zero external dependencies!
"""

import time
from typing import Any, Dict, List, Tuple

from app.algorithms.haversine import build_distance_matrix, haversine_km
from app.algorithms.nearest_neighbor import nearest_neighbor
from app.algorithms.two_opt import calculate_route_distance, two_opt


def optimize_route(
    points: List[Tuple[float, float]],
    return_to_depot: bool = True,
) -> Dict[str, Any]:
    """Optimize the delivery sequence for a list of geographic stops.

    points[0] is strictly treated as the depot (warehouse / starting point).
    points[1..N-1] are the customer delivery stops.

    Args:
        points: List of (latitude, longitude) tuples in decimal degrees.
                points[0] is the starting depot.
        return_to_depot: Whether the vehicle returns to the depot at the end of the route.
                         Defaults to True.

    Returns:
        A dictionary containing:
        - "order": List of integer indices indicating the optimal visit sequence.
        - "total_km": Final route distance in kilometers after 2-opt optimization.
        - "nearest_neighbor_km": Route distance in kilometers before 2-opt.
        - "improvement_percent": Percentage reduction in distance achieved by 2-opt.
        - "runtime_ms": Total wall-clock execution time in milliseconds.
    """
    start_time = time.perf_counter()
    n = len(points)

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
        }

    # -------------------------------------------------------------------------
    # Edge Case 3: 2 stops (depot + exactly 1 delivery stop)
    # There is only one possible visit order: depot (0) -> stop (1).
    # -------------------------------------------------------------------------
    if n == 2:
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
        }

    # -------------------------------------------------------------------------
    # General Case: 3 or more stops
    # -------------------------------------------------------------------------

    # Step 1: Precompute the symmetric N x N distance matrix in O(N^2) time.
    # Precomputing avoids recalculating expensive trigonometric functions inside
    # the optimization loops.
    distance_matrix = build_distance_matrix(points)

    # Step 2: Phase 1 - Greedy Nearest Neighbor construction heuristic.
    # Builds an initial valid tour starting from depot (index 0).
    nn_route = nearest_neighbor(distance_matrix, start=0)
    nn_distance = calculate_route_distance(nn_route, distance_matrix, return_to_depot=return_to_depot)

    # Step 3: Phase 2 - 2-opt local search route improvement.
    # Eliminates crossing paths and inefficient detours by iteratively reversing segments.
    optimized_route = two_opt(nn_route, distance_matrix, return_to_depot=return_to_depot)
    final_distance = calculate_route_distance(optimized_route, distance_matrix, return_to_depot=return_to_depot)

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
    }
