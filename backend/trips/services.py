import requests
import logging
import math
from haversine import haversine
from django.conf import settings
from functools import lru_cache
from .models import DriverLog as Log

logger = logging.getLogger("django")

MAPBOX_API_KEY = settings.MAPBOX_API_KEY

def get_route_details(start, pickup, end):
    """Fetches route details from Mapbox Directions API with error handling."""
        
    url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{start};{pickup};{end}"
    params = {
        "access_token": MAPBOX_API_KEY,
        "geometries": "geojson",
        "steps": "true",
        "overview": "full"
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if "routes" in data and data["routes"]:
            return data
        else:
            logger.error("Mapbox API returned no routes.")
            return None
    except requests.RequestException as e:
        logger.error(f"Mapbox API Error: {e}")
        return None

@lru_cache(maxsize=100)  # Cache responses to reduce API calls
def reverse_geocode(coordinate):
    """Converts latitude,longitude into a human-readable address."""
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{coordinate}.json"
    params = {"access_token": MAPBOX_API_KEY}

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if "features" in data and data["features"]:
            return data["features"][0]["place_name"]
        else:
            return "Unknown Location"
    except requests.RequestException as e:
        logger.error(f"Reverse geocoding failed: {e}")
        return "Unknown Location"


def geocode_location(location):
    """Converts a location name into latitude/longitude coordinates using Mapbox."""
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{location}.json"
    params = {"access_token": MAPBOX_API_KEY, "limit": 1}

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if "features" in data and data["features"]:
            coords = data["features"][0]["center"]
            return f"{coords[0]},{coords[1]}"
    except requests.RequestException as e:
        logger.error(f"Geocoding Error: {e}")
        return None

# Update calculate_trip_details
def calculate_trip_details(route_data, cycle_hours_used):
    """Returns driving_hours, total_hours, total_days"""
    try:
        total_miles = route_data["routes"][0]["distance"] / 1609.34
        driving_hours = route_data["routes"][0]["duration"] / 3600
        total_hours = driving_hours + 2  # Add pickup/drop-off
        total_days = math.ceil(total_hours / 24)
        
        # FMCSA requires at least 10h off-duty between shifts
        required_rest = max(0, total_days - 1) * 10
        total_hours += required_rest
        
        return driving_hours, total_hours, total_miles
    except KeyError as e:
        logger.error(f"Missing key in route data: {e}")
        return None, None, None

FUEL_LIMIT_MILES = 1000  # Refueling every 1,000 miles
REST_BREAK_INTERVAL = 8  # 30-min break required after 8 hours

def calculate_stops(total_miles, total_hours, route_geometry):
    """Determines fuel and rest stops along the route."""
    try:
        fuel_stops = math.floor(total_miles / FUEL_LIMIT_MILES)
        rest_stops = math.ceil(total_hours / REST_BREAK_INTERVAL)

        fuel_locations = []
        for i in range(1, fuel_stops + 1):
            fraction = i / (fuel_stops + 1)
            coord = calculate_interval_point(route_geometry, fraction)
            fuel_locations.append(find_nearest_poi(coord, 'gas_station'))

        rest_locations = []
        for i in range(1, rest_stops + 1):
            fraction = i / (rest_stops + 1)
            coord = calculate_interval_point(route_geometry, fraction)
            logger.info(f"Rest stop coordinates: {coord}")            
            rest_locations.append(find_nearest_poi(coord, 'hotel'))

        logger.info(f"Fuel locations: {fuel_locations}, Rest locations: {rest_locations}")

        return fuel_stops, rest_stops, fuel_locations, rest_locations
    except Exception as e:
        logger.error(f"Error calculating stops: {e}")
        return 0, 0, [], []


def find_nearest_poi(coordinate, poi_type):
    """Find actual POIs using Mapbox Search API"""
    url = f"https://api.mapbox.com/search/v1/category/{poi_type}"
    params = {
        'access_token': MAPBOX_API_KEY,
        'limit': 1,
        'proximity': f"{coordinate[0]},{coordinate[1]}",
        'language': 'en',
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()

        results = response.json()
        logger.info(f"POI search results: {results}")
        if results['features']:
            feature = results['features'][0]
            return {
                "name": feature['properties'].get('place_name', 'Unknown'),
                "icon": feature['properties'].get('maki', 'marker'),
                "coords": feature['geometry']['coordinates']
            }
        return {"name": "Unknown", "icon": "marker", "coords": None}
    except Exception as e:
        logger.error(f"POI search failed: {e}")
        return "Unknown Location"

def calculate_interval_point(route_geometry, fraction):
    """
    Calculate a point along the route at a specified fraction of total distance
    using geographical distance calculations.
    
    Args:
        route_geometry (dict): GeoJSON LineString geometry
        fraction (float): Position along route (0.0-1.0)
        
    Returns:
        tuple: (lon, lat) coordinates of the point
    """
    if not route_geometry or route_geometry['type'] != 'LineString':
        raise ValueError("Invalid route geometry")

    coords = route_geometry['coordinates']
    if len(coords) < 2:
        return coords[0] if coords else None

    # Calculate cumulative distances between all points
    cumulative_distances = [0.0]
    total_distance = 0.0
    
    for i in range(1, len(coords)):
        prev = (coords[i-1][1], coords[i-1][0])  # (lat, lon)
        curr = (coords[i][1], coords[i][0])
        segment_dist = haversine(prev, curr, unit='mi')
        total_distance += segment_dist
        cumulative_distances.append(total_distance)

    target_distance = total_distance * fraction

    # Find the segment where target distance falls
    for i in range(1, len(cumulative_distances)):
        if cumulative_distances[i] >= target_distance:
            # Found the segment between points i-1 and i
            segment_start = i-1
            segment_distance = cumulative_distances[i] - cumulative_distances[i-1]
            remaining = target_distance - cumulative_distances[i-1]
            fraction_along_segment = remaining / segment_distance if segment_distance > 0 else 0
            
            # Get start and end points of the segment
            start_lon, start_lat = coords[segment_start]
            end_lon, end_lat = coords[i]
            
            # Linear interpolation
            lon = start_lon + fraction_along_segment * (end_lon - start_lon)
            lat = start_lat + fraction_along_segment * (end_lat - start_lat)
            return (lon, lat)

    # If fraction >= 1.0, return last point
    return coords[-1]


# Updated compliance check
def check_compliance(trip):
    violations = []
    consecutive_driving_days = 0
    
    for i, log in enumerate(trip.logs.order_by('date')):
        # Sleeper berth validation
        if log.sleeper_berth_hours > 0:
            if not (7 <= log.sleeper_berth_hours <= 8 and 
                   log.off_duty_hours >= 2):
                violations.append(
                    f"Invalid sleeper berth split on {log.date}: "
                    f"Must be 7-8h sleeper + 2h off-duty"
                )
        
        # 34-hour restart check
        if i > 0 and log.sleeper_berth_hours >= 34:
            consecutive_driving_days = 0  # Reset cycle
            
        consecutive_driving_days += 1
        if consecutive_driving_days > 8:
            violations.append("8-day driving limit exceeded")
