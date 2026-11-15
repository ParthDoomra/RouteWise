"""Distance Provider Service for RouteWise.

Provides pairwise distance matrices between geographic coordinates using either:
1. "road": Real-world road network driving distances fetched via the OSRM
   (Open Source Routing Machine) Table API.
2. "haversine": Great-circle spherical distances computed locally via
   app.algorithms.haversine.

Features:
- Pure urllib HTTP client with an 8-second timeout.
- In-memory cache keyed by rounded coordinates (5 decimal places, ~1m precision)
  to prevent redundant external API calls.
- Automatic, graceful fallback to local Haversine distance calculations if OSRM
  is unreachable, times out, returns an error status code, or yields null entries.
  Guaranteed never to crash.
"""

import json
import logging
import socket
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

from app.algorithms.haversine import build_distance_matrix

logger = logging.getLogger(__name__)

# Module-level in-memory cache:
# Key: (mode, tuple_of_rounded_points) -> Value: List[List[float]]
_DISTANCE_MATRIX_CACHE: Dict[Tuple[str, Tuple[Tuple[float, float], ...]], List[List[float]]] = {}

# Stores the most recent OSRM error message for telemetry / user feedback
_last_osrm_error: Optional[str] = None


def get_last_osrm_error() -> Optional[str]:
    """Return the last recorded OSRM error or warning message, if any."""
    return _last_osrm_error


def clear_cache() -> None:
    """Clear the in-memory distance matrix cache (useful for testing)."""
    global _DISTANCE_MATRIX_CACHE, _last_osrm_error
    _DISTANCE_MATRIX_CACHE.clear()
    _last_osrm_error = None


def _make_cache_key(
    points: List[Tuple[float, float]],
    mode: str,
    precision: int = 5,
) -> Tuple[str, Tuple[Tuple[float, float], ...]]:
    """Generate a hashable cache key based on mode and rounded coordinates."""
    rounded_points = tuple(
        (round(float(lat), precision), round(float(lng), precision))
        for lat, lng in points
    )
    return (mode, rounded_points)


def get_distance_matrix(
    points: List[Tuple[float, float]],
    mode: str = "road",
) -> Tuple[List[List[float]], str]:
    """Get an N x N pairwise distance matrix in kilometers for given coordinates.

    Args:
        points: List of (lat, lng) tuples in decimal degrees.
        mode: Distance calculation mode ("road" or "haversine"). Defaults to "road".

    Returns:
        A tuple of (matrix_km, source) where:
        - matrix_km: 2D list of floats representing distance between stops in kilometers.
        - source: One of "osrm", "haversine", or "haversine_fallback".
    """
    global _last_osrm_error

    n = len(points)

    # Edge Case 1: 0 stops
    if n == 0:
        return [], mode if mode in ("road", "haversine") else "haversine"

    # Edge Case 2: 1 stop
    if n == 1:
        return [[0.0]], mode if mode in ("road", "haversine") else "haversine"

    # Haversine mode: compute locally using great-circle formula
    if mode == "haversine":
        return build_distance_matrix(points), "haversine"

    if mode != "road":
        logger.warning("Unrecognized mode '%s'. Defaulting to haversine.", mode)
        return build_distance_matrix(points), "haversine"

    # -------------------------------------------------------------------------
    # Mode: "road" (OSRM Table API)
    # -------------------------------------------------------------------------
    cache_key = _make_cache_key(points, mode="road")
    if cache_key in _DISTANCE_MATRIX_CACHE:
        cached = _DISTANCE_MATRIX_CACHE[cache_key]
        # Return a copy so caller cannot mutate cached matrix
        return [row[:] for row in cached], "osrm"

    # Construct OSRM Table API query
    # Note: OSRM expects coordinates in {longitude},{latitude} format
    coords_str = ";".join(f"{lng},{lat}" for lat, lng in points)
    url = f"http://router.project-osrm.org/table/v1/driving/{coords_str}?annotations=distance"

    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "RouteWise/1.0 (Delivery Route Optimization Engine)",
                "Accept": "application/json",
            },
        )

        with urllib.request.urlopen(req, timeout=8.0) as resp:
            status_code = getattr(resp, "status", 200)
            if status_code != 200:
                raise ValueError(f"OSRM HTTP error: status code {status_code}")

            raw_body = resp.read().decode("utf-8")
            data: Dict[str, Any] = json.loads(raw_body)

        # Validate OSRM response code
        api_code = data.get("code")
        if api_code != "Ok":
            raise ValueError(f"OSRM returned error code: {api_code} ({data.get('message', 'No message')})")

        raw_distances = data.get("distances")
        if not isinstance(raw_distances, list) or len(raw_distances) != n:
            raise ValueError(f"OSRM returned invalid distances matrix structure: expected {n}x{n}")

        matrix_km: List[List[float]] = []
        for i, row in enumerate(raw_distances):
            if not isinstance(row, list) or len(row) != n:
                raise ValueError(f"OSRM returned invalid row {i}: expected length {n}")

            row_km: List[float] = []
            for j, val in enumerate(row):
                if val is None:
                    raise ValueError(f"OSRM distances matrix contains null at [{i}][{j}]")
                if not isinstance(val, (int, float)):
                    raise ValueError(f"OSRM distances matrix contains non-numeric value at [{i}][{j}]: {val}")
                if val < 0:
                    raise ValueError(f"OSRM distances matrix contains negative value at [{i}][{j}]: {val}")

                # Convert metres to kilometers
                # Diagonal distance is strictly 0.0
                dist_km = 0.0 if i == j else float(val) / 1000.0
                row_km.append(dist_km)

            matrix_km.append(row_km)

        # Store in cache
        _DISTANCE_MATRIX_CACHE[cache_key] = [row[:] for row in matrix_km]
        _last_osrm_error = None
        return matrix_km, "osrm"

    except Exception as exc:
        # Graceful fallback: log and return Haversine matrix
        _last_osrm_error = f"{type(exc).__name__}: {str(exc)}"
        logger.warning("OSRM request failed (%s). Falling back to Haversine.", _last_osrm_error)
        fallback_matrix = build_distance_matrix(points)
        return fallback_matrix, "haversine_fallback"
