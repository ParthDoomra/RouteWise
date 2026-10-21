"""2-opt Route Improvement Algorithm.

Why this module exists:
Nearest Neighbor gives us a quick initial route, but it often contains inefficient
crossing edges (like an "X") or awkward detours because it is purely greedy and
cannot see the big picture.

The 2-opt algorithm (first proposed by G.A. Croes in 1958) is a local search
optimization technique designed specifically to eliminate crossing paths and
shorten Traveling Salesperson Problem (TSP) tours.

Viva Explanation:
"What does 2-opt mean?"
- '2-opt' stands for 'two-optimal'. It means that no route can be made shorter
  by removing 2 edges and reconnecting them differently.

"How does 2-opt work physically?"
- Imagine drawing the delivery route on a map. If two delivery lines cross each
  other like an 'X', the driver is wasting fuel crossing back over their own tracks.
- 2-opt cuts those two intersecting lines (edges) and reconnects the endpoints in
  parallel lines (like '=') instead of 'X'.
- Reconnecting the endpoints reverses the order of the stops visited between those
  two cuts:
      Original:  ... -> A -> B -> [stops in between] -> C -> D -> ...
      Reversed:  ... -> A -> C -> [stops in reverse] -> B -> D -> ...
- If this reversal makes the total route shorter, we keep the reversed route.
- We repeat this process until no 2-edge swap can improve the route any further
  (a local minimum is reached) or until our iteration safety cap is hit.

"Why does the depot stay fixed?"
- The delivery vehicle starts at the warehouse/depot (index 0).
- Customers cannot be served before the driver leaves the warehouse!
- Therefore, index 0 is permanently fixed as the first stop. We only consider
  reversing segments starting at index i >= 1.

"Why doesn't reversing the internal segment change its internal distance?"
- Because the distance between any two stops is symmetric:
  dist(stop_u, stop_v) == dist(stop_v, stop_u).
- When a segment is traversed in reverse, the distances between consecutive stops
  inside that segment are identical! Only the two boundary edges change.
"""

from typing import List


def calculate_route_distance(
    route: List[int],
    matrix: List[List[float]],
    return_to_depot: bool = True,
) -> float:
    """Calculate the total distance of a route given a distance matrix.

    Args:
        route: List of stop indices in order of visitation.
        matrix: N x N pairwise distance matrix in kilometers.
        return_to_depot: If True and len(route) > 1, includes the return leg
                         from the final stop back to the depot (route[0]).

    Returns:
        Total distance in kilometers.
    """
    if len(route) < 2:
        return 0.0

    total = 0.0
    for k in range(len(route) - 1):
        total += matrix[route[k]][route[k + 1]]

    if return_to_depot:
        total += matrix[route[-1]][route[0]]

    return total


def two_opt(
    route: List[int],
    matrix: List[List[float]],
    return_to_depot: bool = True,
    max_iterations: int = 1000,
) -> List[int]:
    """Improve a tour using the 2-opt local search heuristic.

    Iteratively cuts 2 edges and reconnects them by reversing the intermediate
    segment whenever that reduces total travel distance.

    Args:
        route: Initial visit order (e.g. from Nearest Neighbor).
               route[0] is the depot and remains strictly fixed.
        matrix: N x N symmetric pairwise distance matrix.
        return_to_depot: If True, evaluates route as a closed tour returning to depot.
        max_iterations: Safety cap to prevent potential infinite loops on edge cases.

    Returns:
        An optimized route order starting at the depot (route[0]).
        The returned route is guaranteed to be <= the initial route in total distance.
    """
    n = len(route)

    # Edge cases: 0, 1, 2, or 3 stops cannot be improved with 2-opt
    # (with <= 3 stops, there is only one unique tour topology).
    if n <= 3:
        return list(route)

    best_route = list(route)
    iteration = 0
    improved = True

    # Continue passes until no improving swap can be found, or max_iterations is reached.
    while improved and iteration < max_iterations:
        improved = False
        iteration += 1

        # We look for two cut points:
        # Edge 1 connects best_route[i - 1] -> best_route[i]
        # Edge 2 connects best_route[j] -> best_route[j + 1] (or route[0] if j == n - 1)
        #
        # Because the depot (index 0) must stay fixed as the starting location,
        # 'i' must start from 1 (the first customer stop after the depot).
        for i in range(1, n - 1):
            for j in range(i + 1, n):
                # Identify the boundary nodes
                node_before_i = best_route[i - 1]
                node_i = best_route[i]
                node_j = best_route[j]

                # Case 1: The second cut is in the middle of the route (j < n - 1)
                if j < n - 1:
                    node_after_j = best_route[j + 1]

                    # Old edges to remove: (node_before_i -> node_i) and (node_j -> node_after_j)
                    old_distance = (
                        matrix[node_before_i][node_i]
                        + matrix[node_j][node_after_j]
                    )

                    # New edges to add: (node_before_i -> node_j) and (node_i -> node_after_j)
                    new_distance = (
                        matrix[node_before_i][node_j]
                        + matrix[node_i][node_after_j]
                    )

                # Case 2: The second cut is at the very last stop (j == n - 1)
                else:
                    if return_to_depot:
                        # The route returns to the depot: best_route[0]
                        node_depot = best_route[0]

                        # Old edges: (node_before_i -> node_i) and (node_j -> node_depot)
                        old_distance = (
                            matrix[node_before_i][node_i]
                            + matrix[node_j][node_depot]
                        )

                        # New edges: (node_before_i -> node_j) and (node_i -> node_depot)
                        new_distance = (
                            matrix[node_before_i][node_j]
                            + matrix[node_i][node_depot]
                        )
                    else:
                        # Open route: no return to depot.
                        # Reversing [i:n] changes the edge into i from (node_before_i -> node_i)
                        # to (node_before_i -> node_j). The terminal stop becomes node_i.
                        old_distance = matrix[node_before_i][node_i]
                        new_distance = matrix[node_before_i][node_j]

                # Delta represents change in distance (new - old).
                # A negative delta means the swap reduces total distance!
                # We use -1e-9 tolerance to prevent floating-point micro-oscillations.
                delta = new_distance - old_distance

                if delta < -1e-9:
                    # We found an improvement! Reverse the subsegment between i and j inclusive.
                    # Python slice assignment reverses in-place efficiently:
                    best_route[i : j + 1] = best_route[i : j + 1][::-1]
                    improved = True

                    # First Improvement Strategy:
                    # Immediately restart checking after finding an improvement.
                    # This converges faster than checking all remaining pairs in this pass.
                    break

            if improved:
                break

    return best_route
