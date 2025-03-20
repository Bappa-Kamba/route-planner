from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import DriverLog as Log, Trip
from .serializers import TripSerializer, LogSerializer
from .services import get_route_details, calculate_trip_details, calculate_stops, geocode_location
from datetime import timedelta, date
import logging

logger = logging.getLogger("django")


@api_view(['POST'])
def create_trip(request):
    serializer = TripSerializer(data=request.data)
    logger.info("Creating a new trip")
    logger.info(f"Request data: {request.data}")

    if serializer.is_valid():
        logger.info("Trip serializer is valid")
        trip = serializer.save()

        route_data = get_route_details(trip.current_location, trip.pickup_location, trip.dropoff_location)

        if not route_data:
            return Response({"error": "Failed to fetch route"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        total_hours, total_miles, total_days = calculate_trip_details(
            route_data)

        if total_hours is None or total_miles is None or total_days is None:
            return Response({"error": "Invalid route data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        fuel_stops, rest_stops, fuel_locations, rest_locations = calculate_stops(
            total_miles, total_hours, route_data["routes"][0]["geometry"])

        # Generate logs
        log_entries = []
        start_date = date.today()
        remaining_hours = total_hours
        current_date = start_date

        while remaining_hours > 0:
            driving_hours_today = min(11, remaining_hours)
            on_duty_hours_today = min(14, driving_hours_today + 3)
            off_duty_hours_today = 10

            remaining_hours -= driving_hours_today

            log_entry = Log.objects.create(
                trip=trip,
                date=current_date.isoformat(),
                driving_hours=driving_hours_today,
                on_duty_hours=on_duty_hours_today,
                off_duty_hours=off_duty_hours_today,
                sleeper_berth_hours=0
            )
            log_entries.append(log_entry)
            current_date += timedelta(days=1)

        return Response({
            "trip": TripSerializer(trip).data,
            "route_info": {
                "distance": f"{total_miles:.2f} miles",
                "duration": f"{total_hours:.2f} hours"
            },
            "stops": {
                "fuel_stops": fuel_stops,
                "rest_stops": rest_stops,
                "fuel_stop_locations": fuel_locations,
                "rest_stop_locations": rest_locations
            },
            "logs": LogSerializer(log_entries, many=True).data,
            "route_geometry": route_data["routes"][0]["geometry"]
        }, status=status.HTTP_201_CREATED)
    logger.error("Trip serializer is invalid")
    logger.error(f"Errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_all_trips(request):
    """Retrieve all trips with their logs."""
    logger.info("Fetching all trips")

    trips = Trip.objects.all()
    serialized_trips = TripSerializer(trips, many=True).data

    return Response(serialized_trips, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_trip_by_id(request, trip_id):
    """Retrieve a specific trip by ID, including logs and details."""
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        logger.error(f"Trip {trip_id} not found")
        return Response({"error": "Trip not found"}, status=status.HTTP_404_NOT_FOUND)

    logger.info(f"Fetching details for trip {trip_id}")

    trip_data = TripSerializer(trip).data
    logs = Log.objects.filter(trip=trip)
    logs_data = LogSerializer(logs, many=True).data

    return Response({
        "trip": trip_data,
        "logs": logs_data
    }, status=status.HTTP_200_OK)
