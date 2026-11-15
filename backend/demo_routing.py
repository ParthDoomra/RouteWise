"""RouteWise Routing Demonstration & Performance Benchmark Script.

Demonstrates:
1. Realistic 8-stop Zirakpur & Tricity delivery route optimization in BOTH:
   - "haversine" mode (straight-line great-circle spherical distance)
   - "road" mode (OSRM driving distance via road network)
2. Side-by-side comparison of routes: visit sequence, leg-by-leg km, total distance,
   distance reduction %, and distance source.
3. Analysis of whether road network geometry changes the optimal stop visiting order.
4. Scalability and runtime benchmarking on 10, 20, and 50 stops generated
   within the Zirakpur-Chandigarh-Mohali bounding box.
"""

import os
import random
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Ensure backend root is on sys.path so 'app' imports work smoothly
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.algorithms.haversine import build_distance_matrix, haversine_km
from app.algorithms.nearest_neighbor import nearest_neighbor
from app.algorithms.optimizer import optimize_route
from app.algorithms.two_opt import calculate_route_distance, two_opt
from app.services.distance_provider import get_distance_matrix, get_last_osrm_error


# -----------------------------------------------------------------------------
# 8 Realistic Zirakpur & Tricity Landmarks (Depot + 7 Delivery Hubs)
# -----------------------------------------------------------------------------
ZIRAKPUR_DELIVERY_NETWORK = [
    {
        "id": 0,
        "name": "Zirakpur Central Depot (VIP Road / Main Chowk)",
        "short": "Zirakpur Depot",
        "lat": 30.6425,
        "lng": 76.8173,
        "role": "Depot (Start & Finish)",
    },
    {
        "id": 1,
        "name": "Chandigarh Sector 17 (City Centre)",
        "short": "Chd Sector 17",
        "lat": 30.7410,
        "lng": 76.7790,
        "role": "Delivery Stop #1",
    },
    {
        "id": 2,
        "name": "Mohali Phase 7 / Sector 70",
        "short": "Mohali Phase 7",
        "lat": 30.7025,
        "lng": 76.7164,
        "role": "Delivery Stop #2",
    },
    {
        "id": 3,
        "name": "Panchkula Sector 5 (Town Park)",
        "short": "Panchkula Sec 5",
        "lat": 30.6924,
        "lng": 76.8537,
        "role": "Delivery Stop #3",
    },
    {
        "id": 4,
        "name": "Dera Bassi (Highway Junction)",
        "short": "Dera Bassi",
        "lat": 30.5855,
        "lng": 76.8437,
        "role": "Delivery Stop #4",
    },
    {
        "id": 5,
        "name": "Kharar (Main Chowk)",
        "short": "Kharar Chowk",
        "lat": 30.7455,
        "lng": 76.6485,
        "role": "Delivery Stop #5",
    },
    {
        "id": 6,
        "name": "Chandigarh Airport / Sector 81 Area",
        "short": "Chd Airport",
        "lat": 30.6726,
        "lng": 76.7885,
        "role": "Delivery Stop #6",
    },
    {
        "id": 7,
        "name": "Baltana (Main Market)",
        "short": "Baltana Market",
        "lat": 30.6550,
        "lng": 76.8280,
        "role": "Delivery Stop #7",
    },
]


def print_banner(title: str, width: int = 86) -> None:
    """Print a prominent visual section header."""
    print("\n" + "=" * width)
    print(f" {title.upper()} ".center(width, "="))
    print("=" * width)


def run_zirakpur_demo() -> Dict[str, Any]:
    """Run optimization on the 8 Zirakpur-Tricity delivery points in both modes."""
    print_banner("PART 1: Zirakpur & Tricity Delivery Optimization (Haversine vs Road)")

    points = [(loc["lat"], loc["lng"]) for loc in ZIRAKPUR_DELIVERY_NETWORK]
    names = [loc["name"] for loc in ZIRAKPUR_DELIVERY_NETWORK]
    short_names = [loc["short"] for loc in ZIRAKPUR_DELIVERY_NETWORK]

    print("\n[STOPS REGISTERED]")
    for loc in ZIRAKPUR_DELIVERY_NETWORK:
        print(f"  [{loc['id']}] {loc['name']:<50} ({loc['lat']:.4f}, {loc['lng']:.4f}) - {loc['role']}")

    # -------------------------------------------------------------------------
    # 1. Mode: Haversine (Straight-Line)
    # -------------------------------------------------------------------------
    mat_hav, src_hav = get_distance_matrix(points, mode="haversine")
    res_hav = optimize_route(
        points,
        return_to_depot=True,
        matrix=mat_hav,
        distance_source=src_hav,
    )

    # -------------------------------------------------------------------------
    # 2. Mode: Road (OSRM Driving Distance)
    # -------------------------------------------------------------------------
    mat_road, src_road = get_distance_matrix(points, mode="road")
    osrm_error = get_last_osrm_error()

    # Explicit network status check
    print("\n" + "-" * 86)
    print(" OSRM ROAD NETWORK CONNECTIVITY STATUS")
    print("-" * 86)
    if src_road == "osrm":
        print("  Status: [ONLINE] Successfully fetched real road driving distance matrix from OSRM.")
    else:
        print("  Status: [OFFLINE / FALLBACK] OSRM public API call failed from this network environment.")
        if osrm_error:
            print(f"  Reason: {osrm_error}")
        print("  Graceful Fallback: Seamlessly switched to local Haversine distance matrix.")
    print(f"  Effective Road Distance Source: {src_road}")

    res_road = optimize_route(
        points,
        return_to_depot=True,
        matrix=mat_road,
        distance_source=src_road,
    )

    # -------------------------------------------------------------------------
    # Side-by-Side Comparison
    # -------------------------------------------------------------------------
    print("\n" + "=" * 86)
    print(" SIDE-BY-SIDE ROUTE COMPARISON (HAVERSINE vs ROAD)")
    print("=" * 86)
    print(f" {'METRIC / PROPERTY':<26} | {'HAVERSINE (STRAIGHT-LINE)':<27} | {'ROAD NETWORK (' + src_road.upper() + ')':<26}")
    print("-" * 86)
    print(f" {'Distance Source':<26} | {src_hav:<27} | {src_road:<26}")

    order_hav_str = f"{res_hav['order']} -> 0"
    order_road_str = f"{res_road['order']} -> 0"
    print(f" {'Optimized Stop Order':<26} | {order_hav_str:<27} | {order_road_str:<26}")
    print(f" {'Initial (NN) Distance':<26} | {res_hav['nearest_neighbor_km']:>8.2f} km                | {res_road['nearest_neighbor_km']:>8.2f} km")
    print(f" {'Optimized (2-opt) Dist':<26} | {res_hav['total_km']:>8.2f} km                | {res_road['total_km']:>8.2f} km")

    saved_hav = res_hav['nearest_neighbor_km'] - res_hav['total_km']
    saved_road = res_road['nearest_neighbor_km'] - res_road['total_km']
    print(f" {'Distance Saved':<26} | {saved_hav:>8.2f} km                | {saved_road:>8.2f} km")
    print(f" {'Improvement %':<26} | {res_hav['improvement_percent']:>8.2f} %                 | {res_road['improvement_percent']:>8.2f} %")
    print(f" {'Pipeline Runtime':<26} | {res_hav['runtime_ms']:>8.3f} ms                | {res_road['runtime_ms']:>8.3f} ms")

    # -------------------------------------------------------------------------
    # Leg-by-Leg Comparative Breakdown
    # -------------------------------------------------------------------------
    print("\n" + "-" * 86)
    print(" LEG-BY-LEG ITINERARY BREAKDOWN")
    print("-" * 86)
    print(f" {'Leg':<4} | {'Haversine Stop -> Next Stop':<28} {'Distance':<10} | {'Road Stop -> Next Stop':<28} {'Distance':<10}")
    print("-" * 86)

    full_order_hav = res_hav["order"] + [0]
    full_order_road = res_road["order"] + [0]

    num_legs = len(res_hav["order"])
    for i in range(num_legs):
        u_h, v_h = full_order_hav[i], full_order_hav[i + 1]
        leg_dist_h = mat_hav[u_h][v_h]
        leg_str_h = f"[{u_h}] {short_names[u_h]} -> [{v_h}] {short_names[v_h]}"

        u_r, v_r = full_order_road[i], full_order_road[i + 1]
        leg_dist_r = mat_road[u_r][v_r]
        leg_str_r = f"[{u_r}] {short_names[u_r]} -> [{v_r}] {short_names[v_r]}"

        print(f" {i + 1:<4} | {leg_str_h:<28} {leg_dist_h:>7.2f} km | {leg_str_r:<28} {leg_dist_r:>7.2f} km")

    print("-" * 86)
    print(f" {'TOTAL':<4} | {'Complete Round Tour':<28} {res_hav['total_km']:>7.2f} km | {'Complete Round Tour':<28} {res_road['total_km']:>7.2f} km")

    # -------------------------------------------------------------------------
    # Order Comparison & Heuristic Analysis
    # -------------------------------------------------------------------------
    order_differs = (res_hav["order"] != res_road["order"])
    hav_order = res_hav["order"]
    road_order = res_road["order"]

    print("\n" + "-" * 86)
    print(" STOP ORDER COMPARISON & HEURISTIC ANALYSIS")
    print("-" * 86)

    # 1. Comparison of orders (evaluated dynamically from actual run)
    if order_differs:
        print("  Stop Order Comparison: The two modes produced DIFFERENT stop sequences.")
        print(f"    - Haversine Order : {hav_order} -> 0")
        hav_seq = " -> ".join(f"[{idx}] {short_names[idx]}" for idx in hav_order + [0])
        print(f"      Sequence        : {hav_seq}")
        print(f"    - Road Mode Order : {road_order} -> 0")
        road_seq = " -> ".join(f"[{idx}] {short_names[idx]}" for idx in road_order + [0])
        print(f"      Sequence        : {road_seq}")
        print("  Analysis: Differences between road geometry and straight-line paths caused")
        print("  the heuristic to select a different visiting sequence.")
    else:
        print("  Stop Order Comparison: Both modes produced the IDENTICAL stop visiting sequence.")
        seq = " -> ".join(f"[{idx}] {short_names[idx]}" for idx in hav_order + [0])
        print(f"    - Visit Order     : {hav_order} -> 0")
        print(f"    - Full Sequence   : {seq}")
        print("  Analysis: The heuristic converged on the same topological sequence under both")
        print("  distance models.")

    # 2. Road to Straight-line Distance Ratio (computed dynamically from actual totals)
    if res_hav["total_km"] > 0:
        ratio = res_road["total_km"] / res_hav["total_km"]
    else:
        ratio = 1.0

    print(f"\n  Distance Ratio (Road / Straight-Line):")
    print(f"    - Ratio Value     : {ratio:.2f}x ({res_road['total_km']:.2f} km road vs {res_hav['total_km']:.2f} km straight-line)")
    if src_road == "osrm":
        print("    - Meaning         : Road network driving paths are longer than great-circle lines")
        print("                        due to actual street layouts, curves, and turns.")
    else:
        print(f"    - Meaning         : Source is '{src_road}'. Because fallback was active, ratio is 1.00x.")

    # 3. Heuristic nature of 2-opt (plainly stating it is not proven optimal)
    print("\n  Heuristic Note:")
    print("    - Nearest Neighbor and 2-opt are heuristic algorithms designed to find efficient,")
    print("      high-quality routes in sub-millisecond execution time.")
    print("    - 2-opt iteratively cuts crossings until reaching a local minimum; it yields")
    print("      a good, practical route but does not guarantee the mathematically proven")
    print("      global optimum.")

    return {
        "haversine": res_hav,
        "road": res_road,
        "order_differs": order_differs,
    }


def benchmark_size(n_points: int, num_trials: int = 10, seed: int = 42) -> None:
    """Benchmark performance and runtime on random coordinates within Zirakpur-Chandigarh-Mohali bounds."""
    LAT_MIN, LAT_MAX = 30.5800, 30.7600
    LNG_MIN, LNG_MAX = 76.6400, 76.8600

    rng = random.Random(seed)

    runtimes_ms: List[float] = []
    nn_distances: List[float] = []
    final_distances: List[float] = []

    for _ in range(num_trials):
        points: List[Tuple[float, float]] = [
            (rng.uniform(LAT_MIN, LAT_MAX), rng.uniform(LNG_MIN, LNG_MAX))
            for _ in range(n_points)
        ]

        result = optimize_route(points, return_to_depot=True)
        runtimes_ms.append(result["runtime_ms"])
        nn_distances.append(result["nearest_neighbor_km"])
        final_distances.append(result["total_km"])

    avg_time = sum(runtimes_ms) / num_trials
    min_time = min(runtimes_ms)
    max_time = max(runtimes_ms)
    avg_nn_dist = sum(nn_distances) / num_trials
    avg_final_dist = sum(final_distances) / num_trials
    avg_imp = ((avg_nn_dist - avg_final_dist) / avg_nn_dist) * 100.0 if avg_nn_dist > 0 else 0.0

    print(f"\n[BENCHMARK] {n_points} STOPS ({num_trials} trials):")
    print(f"  Average Runtime        : {avg_time:.3f} ms  (Min: {min_time:.3f} ms, Max: {max_time:.3f} ms)")
    print(f"  Average NN Distance    : {avg_nn_dist:.2f} km")
    print(f"  Average 2-opt Distance : {avg_final_dist:.2f} km")
    print(f"  Average Improvement    : {avg_imp:.2f}%")


def run_benchmarks() -> None:
    """Run scalability benchmarks for 10, 20, and 50 points."""
    print_banner("PART 2: Scalability Benchmarking (10, 20, 50 Stops)")
    print("Testing realistic delivery batches across Zirakpur-Chandigarh-Mohali region...")

    for count in [10, 20, 50]:
        benchmark_size(n_points=count, num_trials=10, seed=100 + count)


# Backwards-compatibility alias in case external callers expect run_bengaluru_demo
run_bengaluru_demo = run_zirakpur_demo


if __name__ == "__main__":
    run_zirakpur_demo()
    run_benchmarks()
