"""Unit & Integration Tests for RouteWise Optimization Algorithms.

Validates:
1. Haversine distance: point to self is 0, symmetry, Bengaluru to Mumbai straight-line distance.
2. Distance matrix construction: dimensions, symmetry, zero diagonal.
3. Nearest Neighbor heuristic: visits every stop exactly once, starts at depot.
4. 2-opt heuristic: never returns a route longer than Nearest Neighbor, depot fixed.
5. Hand-crafted crossing path: NN produces a crossing and 2-opt uncrosses it with measurable improvement.
6. Edge cases: 0 stops, 1 stop, 2 stops, duplicate coordinates, all identical points.
7. Determinism: same input always produces identical route order and distance.
"""

import pytest

from app.algorithms.haversine import build_distance_matrix, haversine_km
from app.algorithms.nearest_neighbor import nearest_neighbor
from app.algorithms.optimizer import optimize_route
from app.algorithms.two_opt import calculate_route_distance, two_opt


# =============================================================================
# 1. Haversine Formula Tests
# =============================================================================

def test_haversine_point_to_itself_is_zero():
    """Distance from any geographic coordinate to itself must be exactly 0.0 km."""
    test_coordinates = [
        (0.0, 0.0),
        (12.9716, 77.5946),    # Bengaluru
        (19.0760, 72.8777),    # Mumbai
        (28.6139, 77.2090),    # New Delhi
        (-33.8688, 151.2093),  # Sydney (Southern / Eastern hemisphere)
        (40.7128, -74.0060),   # New York (Northern / Western hemisphere)
    ]
    for lat, lng in test_coordinates:
        dist = haversine_km(lat, lng, lat, lng)
        assert dist == 0.0, f"Distance from ({lat}, {lng}) to itself was {dist}, expected 0.0"


def test_haversine_is_symmetric():
    """Distance from Point A to Point B must strictly equal distance from Point B to Point A."""
    pairs = [
        ((12.9716, 77.5946), (19.0760, 72.8777)),  # Bengaluru <-> Mumbai
        ((28.6139, 77.2090), (13.0827, 80.2707)),  # Delhi <-> Chennai
        ((0.0, 0.0), (10.0, 20.0)),
        ((-22.9068, -43.1729), (51.5074, -0.1278)), # Rio <-> London
    ]
    for (lat1, lng1), (lat2, lng2) in pairs:
        d1 = haversine_km(lat1, lng1, lat2, lng2)
        d2 = haversine_km(lat2, lng2, lat1, lng1)
        assert pytest.approx(d1, rel=1e-9) == d2, f"Asymmetric distance: {d1} != {d2}"


def test_haversine_bengaluru_to_mumbai():
    """Bengaluru to Mumbai straight-line great-circle distance is roughly 840 km."""
    blr_lat, blr_lng = 12.9716, 77.5946
    bom_lat, bom_lng = 19.0760, 72.8777

    dist = haversine_km(blr_lat, blr_lng, bom_lat, bom_lng)

    # Standard great-circle distance between BLR and BOM is ~845 km.
    # We test with an acceptable tolerance band of roughly 840 km (+/- 15 km).
    assert 830.0 <= dist <= 860.0, f"Expected roughly 840 km, got {dist:.2f} km"


def test_build_distance_matrix():
    """Verify distance matrix is square, symmetric, and has zero diagonal."""
    points = [
        (12.9716, 77.5946),  # BLR
        (19.0760, 72.8777),  # BOM
        (13.0827, 80.2707),  # MAA
    ]
    matrix = build_distance_matrix(points)

    assert len(matrix) == 3
    for row in matrix:
        assert len(row) == 3

    # Diagonal must be 0.0
    for i in range(3):
        assert matrix[i][i] == 0.0

    # Symmetric: matrix[i][j] == matrix[j][i]
    for i in range(3):
        for j in range(3):
            assert matrix[i][j] == matrix[j][i]


# =============================================================================
# 2. Nearest Neighbor Tests
# =============================================================================

def test_nearest_neighbor_visits_every_stop_once_and_starts_at_depot():
    """Nearest neighbor must begin at depot (0) and contain each stop index exactly once."""
    points = [
        (12.9781, 77.5695),  # Depot
        (12.9756, 77.6066),
        (12.9719, 77.6412),
        (12.9352, 77.6245),
        (12.9116, 77.6389),
        (12.8452, 77.6602),
        (12.9308, 77.5838),
        (12.9863, 77.7308),
    ]
    matrix = build_distance_matrix(points)
    route = nearest_neighbor(matrix, start=0)

    # Must start at depot
    assert route[0] == 0

    # Length must equal total points
    assert len(route) == len(points)

    # Every index from 0 to N-1 must appear exactly once (permutation)
    assert sorted(route) == list(range(len(points)))


# =============================================================================
# 3. 2-opt Improvement Tests
# =============================================================================

def test_two_opt_never_returns_route_longer_than_nearest_neighbor():
    """2-opt must never degrade route quality; final distance <= NN distance."""
    # Test across multiple datasets of varying sizes
    datasets = [
        # 4 points
        [(12.0, 77.0), (12.1, 77.1), (12.2, 77.0), (12.1, 76.9)],
        # 6 points
        [(12.0, 77.0), (12.5, 77.0), (12.5, 77.5), (12.0, 77.5), (12.2, 77.2), (12.3, 77.3)],
        # 8 Bengaluru delivery points
        [
            (12.9781, 77.5695),
            (12.9756, 77.6066),
            (12.9719, 77.6412),
            (12.9352, 77.6245),
            (12.9116, 77.6389),
            (12.8452, 77.6602),
            (12.9308, 77.5838),
            (12.9863, 77.7308),
        ],
    ]

    for points in datasets:
        matrix = build_distance_matrix(points)
        for return_to_depot in (True, False):
            nn_route = nearest_neighbor(matrix, start=0)
            opt_route = two_opt(nn_route, matrix, return_to_depot=return_to_depot)

            # Must start at depot
            assert opt_route[0] == 0

            # Must visit every stop exactly once
            assert sorted(opt_route) == list(range(len(points)))

            # Distance must not increase
            d_nn = calculate_route_distance(nn_route, matrix, return_to_depot=return_to_depot)
            d_opt = calculate_route_distance(opt_route, matrix, return_to_depot=return_to_depot)

            assert d_opt <= d_nn + 1e-9, (
                f"2-opt made route longer! NN: {d_nn:.4f} km, 2-opt: {d_opt:.4f} km "
                f"(return_to_depot={return_to_depot})"
            )


def test_hand_made_crossing_path_improved_by_two_opt():
    """Hand-crafted geometric scenario where Nearest Neighbor creates an 'X' cross and 2-opt fixes it.

    Geometry:
    - Depot 0: (12.08, 77.36)
    - Stop 1:  (12.48, 77.04) [Top Left]
    - Stop 2:  (12.16, 77.07) [Bottom Left]
    - Stop 3:  (12.31, 77.48) [Top Right]

    Trace of Nearest Neighbor:
    - Starts at 0 (Depot).
    - Closest to 0 is Stop 3 (Top Right).
    - From Stop 3, closest unvisited is Stop 2 (Bottom Left) -> diagonal jump across the map!
    - From Stop 2, only unvisited is Stop 1 (Top Left).
    - From Stop 1, return to Depot 0 (Bottom Right).
    -> Edges (3 -> 2) and (1 -> 0) intersect in an 'X' cross! Total NN distance = ~168.47 km.

    Trace of 2-opt:
    - Detects the crossing edges (3 -> 2) and (1 -> 0).
    - Uncrosses them into parallel edges (3 -> 1) and (2 -> 0).
    - Route becomes [0, 3, 1, 2] with total distance = ~148.59 km.
    - Yields an improvement of nearly 20 km (~11.8%).
    """
    crossing_points = [
        (12.08, 77.36),  # 0: Depot
        (12.48, 77.04),  # 1: Top Left
        (12.16, 77.07),  # 2: Bottom Left
        (12.31, 77.48),  # 3: Top Right
    ]

    result = optimize_route(crossing_points, return_to_depot=True)

    # Verify Nearest Neighbor produced the crossing order [0, 3, 2, 1]
    matrix = build_distance_matrix(crossing_points)
    raw_nn = nearest_neighbor(matrix, start=0)
    assert raw_nn == [0, 3, 2, 1], f"Expected NN order [0, 3, 2, 1], got {raw_nn}"

    # Verify 2-opt uncrossed the path to [0, 3, 1, 2]
    assert result["order"] == [0, 3, 1, 2], f"Expected 2-opt order [0, 3, 1, 2], got {result['order']}"

    # Verify measurable improvement
    assert result["total_km"] < result["nearest_neighbor_km"]
    assert result["improvement_percent"] > 10.0, (
        f"Expected > 10% improvement, got {result['improvement_percent']}% "
        f"(NN: {result['nearest_neighbor_km']} km -> 2-opt: {result['total_km']} km)"
    )


# =============================================================================
# 4. Edge Cases Tests
# =============================================================================

def test_edge_case_zero_stops():
    """0 stops (empty list) should return an empty order and zero distance without crashing."""
    result = optimize_route([])
    assert result["order"] == []
    assert result["total_km"] == 0.0
    assert result["nearest_neighbor_km"] == 0.0
    assert result["improvement_percent"] == 0.0
    assert result["runtime_ms"] >= 0.0


def test_edge_case_one_stop():
    """1 stop (only the depot) should return [0] and 0.0 distance without crashing."""
    result = optimize_route([(12.9716, 77.5946)])
    assert result["order"] == [0]
    assert result["total_km"] == 0.0
    assert result["nearest_neighbor_km"] == 0.0
    assert result["improvement_percent"] == 0.0
    assert result["runtime_ms"] >= 0.0


def test_edge_case_two_stops():
    """2 stops (depot + 1 customer) should return [0, 1] and correct round-trip distance."""
    depot = (12.9781, 77.5695)
    customer = (12.9756, 77.6066)
    one_way_dist = haversine_km(depot[0], depot[1], customer[0], customer[1])

    # Case A: return to depot (round trip)
    result_round_trip = optimize_route([depot, customer], return_to_depot=True)
    assert result_round_trip["order"] == [0, 1]
    assert pytest.approx(result_round_trip["total_km"], abs=0.05) == round(2.0 * one_way_dist, 2)
    assert result_round_trip["improvement_percent"] == 0.0

    # Case B: one-way trip (no return to depot)
    result_one_way = optimize_route([depot, customer], return_to_depot=False)
    assert result_one_way["order"] == [0, 1]
    assert pytest.approx(result_one_way["total_km"], abs=0.05) == round(one_way_dist, 2)
    assert result_one_way["improvement_percent"] == 0.0


def test_edge_case_duplicate_coordinates():
    """Duplicate coordinates (e.g. multiple deliveries at the same building) must not crash."""
    points_with_duplicates = [
        (12.9716, 77.5946),  # Depot
        (12.9716, 77.5946),  # Duplicate of depot (same building)
        (12.9352, 77.6245),  # Customer A
        (12.9352, 77.6245),  # Duplicate customer A (another parcel for same building)
        (12.9863, 77.7308),  # Customer B
    ]
    result = optimize_route(points_with_duplicates, return_to_depot=True)

    # All 5 stops must be visited
    assert len(result["order"]) == 5
    assert sorted(result["order"]) == list(range(5))
    assert result["order"][0] == 0
    assert result["total_km"] > 0.0


def test_edge_case_all_identical_points():
    """All points sharing exact same coordinate must resolve to distance 0.0 without division by zero."""
    identical_points = [(12.9716, 77.5946)] * 4
    result = optimize_route(identical_points, return_to_depot=True)

    assert len(result["order"]) == 4
    assert sorted(result["order"]) == list(range(4))
    assert result["total_km"] == 0.0
    assert result["nearest_neighbor_km"] == 0.0
    assert result["improvement_percent"] == 0.0


# =============================================================================
# 5. Determinism Test
# =============================================================================

def test_deterministic_output():
    """The exact same inputs must produce identical output across multiple runs."""
    points = [
        (12.9781, 77.5695),
        (12.9756, 77.6066),
        (12.9719, 77.6412),
        (12.9352, 77.6245),
        (12.9116, 77.6389),
        (12.8452, 77.6602),
        (12.9308, 77.5838),
        (12.9863, 77.7308),
    ]

    first_result = optimize_route(points, return_to_depot=True)

    for _ in range(5):
        subsequent_result = optimize_route(points, return_to_depot=True)
        assert subsequent_result["order"] == first_result["order"]
        assert subsequent_result["total_km"] == first_result["total_km"]
        assert subsequent_result["nearest_neighbor_km"] == first_result["nearest_neighbor_km"]
        assert subsequent_result["improvement_percent"] == first_result["improvement_percent"]
