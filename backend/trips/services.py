import requests
import logging
import math
from datetime import timedelta, date
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

def calculate_trip_details(route_data):
    """Extracts distance and duration from route response with error handling."""
    if not route_data or "routes" not in route_data or not route_data["routes"]:
        logger.error("Invalid route data received.")
        return None, None, None

    try:
        total_miles = route_data["routes"][0]["distance"] / 1609.34  # Meters to miles
        total_hours = route_data["routes"][0]["duration"] / 3600  # Seconds to hours
        total_hours += 2  # Pickup + drop-off time
        total_days = math.ceil(total_hours / 24)
        return total_hours, total_miles, total_days
    except KeyError as e:
        logger.error(f"Missing key in route data: {e}")
        return None, None, None

FUEL_LIMIT_MILES = 1000  # Refueling every 1,000 miles
REST_BREAK_INTERVAL_HOURS = 8  # 30-min break required after 8 hours

def calculate_stops(total_miles, total_hours, route_geometry):
    """Determines fuel and rest stops along the route."""
    try:
        fuel_stops = max(1, total_miles // FUEL_LIMIT_MILES)
        rest_stops = max(1, total_hours // REST_BREAK_INTERVAL_HOURS)

        fuel_locations = []
        rest_locations = []

        # Select fuel stops along the route
        for i in range(int(fuel_stops)):
            index = int((i + 1) * len(route_geometry["coordinates"]) / (fuel_stops + 1))
            coord = f"{route_geometry['coordinates'][index][0]},{route_geometry['coordinates'][index][1]}"
            fuel_locations.append(reverse_geocode(coord))

        # Select rest stops along the route
        for i in range(int(rest_stops)):
            index = int((i + 1) * len(route_geometry["coordinates"]) / (rest_stops + 1))
            coord = f"{route_geometry['coordinates'][index][0]},{route_geometry['coordinates'][index][1]}"
            rest_locations.append(reverse_geocode(coord))

        return fuel_stops, rest_stops, fuel_locations, rest_locations
    except Exception as e:
        logger.error(f"Error calculating stops: {e}")
        return 0, 0, [], []
