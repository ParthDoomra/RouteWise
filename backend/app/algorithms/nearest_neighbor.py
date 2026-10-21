"""Nearest Neighbor Route Construction Algorithm.

Why this module exists:
Finding the absolute shortest route through N delivery stops is the classic
Traveling Salesperson Problem (TSP), which is NP-hard. An exact brute-force search
would take O(N!) time. For even 15 stops, 15! is 1.3 trillion permutations, which
would freeze any server.

Instead of brute force, we use a two-phase heuristic approach:
Phase 1 (Construction): Generate a fast, valid, and reasonably good initial route.
Phase 2 (Improvement): Optimize that route using 2-opt local search.

Nearest Neighbor is our Phase 1 construction heuristic.

Viva Explanation:
"How does Nearest Neighbor work?"
- It is a greedy algorithm.
- Starting at the depot (stop index 0), it looks at all unvisited stops and moves
  to whichever stop is physically closest.
- From that new stop, it repeats the process: pick the closest unvisited stop.
- It repeats this until all stops have been visited exactly once.

"What is the Time Complexity?"
- O(N^2) time complexity.
  For N stops: from the 1st stop we check N-1 candidates, from the 2nd stop N-2,
  and so forth. Sum = N*(N-1)/2, which is O(N^2).
  For 50 stops, that's only ~1,225 operations—executing in a fraction of a millisecond!

"What is the limitation of Nearest Neighbor (Why do we need 2-opt)?"
- Greediness has a blind spot! Because it only cares about the very next stop,
  it doesn't look ahead to the whole journey.
- Near the end of the route, the unvisited stops are often scattered far apart.
  The vehicle is forced to make long, erratic jumps to pick up remaining stops,
  often crossing its own path and creating an inefficient "spider-web" or "X" pattern.
- That's why Nearest Neighbor is only the starting point; we pass its output to
  2-opt to untangle and optimize the route.
"""

from typing import List


def nearest_neighbor(matrix: List[List[float]], start: int = 0) -> List[int]:
    """Construct an initial route order using the greedy Nearest Neighbor heuristic.

    Args:
        matrix: An N x N 2D list where matrix[i][j] is the distance from stop i to stop j.
        start: The index of the starting point (depot). Defaults to 0.

    Returns:
        A list of stop indices in visit order, beginning with `start`.
        Every stop is visited exactly once.
    """
    n = len(matrix)

    # Edge Case 1: Empty input (0 stops)
    if n == 0:
        return []

    # Edge Case 2: Only 1 stop (just the depot itself)
    if n == 1:
        return [start]

    # Validate start index bounds
    if not (0 <= start < n):
        raise ValueError(f"Start index {start} out of bounds for matrix with {n} nodes.")

    # Track which stops have already been added to the route.
    # A boolean lookup array is O(1) for membership checks.
    visited = [False] * n

    # The route begins at the depot
    route: List[int] = [start]
    visited[start] = True
    current = start

    # We need to visit the remaining (n - 1) stops
    for _ in range(n - 1):
        best_candidate = -1
        best_distance = float("inf")

        # Scan all stops to find the closest unvisited one
        for candidate in range(n):
            if not visited[candidate]:
                dist = matrix[current][candidate]
                # Tie-breaking rule: if distances are strictly equal (e.g. duplicate coordinates),
                # candidate < best_candidate ensures strictly deterministic behavior.
                if dist < best_distance:
                    best_distance = dist
                    best_candidate = candidate

        # Append the closest stop found to the route
        route.append(best_candidate)
        visited[best_candidate] = True
        current = best_candidate

    return route
