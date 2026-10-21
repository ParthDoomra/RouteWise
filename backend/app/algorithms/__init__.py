"""RouteWise Algorithm Package.

Contains standalone, pure-Python optimization algorithms for the RouteWise system:
- haversine: Great-circle distance and distance matrix construction.
- nearest_neighbor: Greedy tour construction heuristic.
- two_opt: 2-opt local search route improvement heuristic.
- optimizer: End-to-end route optimization pipeline combining NN and 2-opt.
"""

from app.algorithms.haversine import haversine_km, build_distance_matrix
from app.algorithms.nearest_neighbor import nearest_neighbor
from app.algorithms.two_opt import two_opt, calculate_route_distance
from app.algorithms.optimizer import optimize_route

__all__ = [
    "haversine_km",
    "build_distance_matrix",
    "nearest_neighbor",
    "two_opt",
    "calculate_route_distance",
    "optimize_route",
]
