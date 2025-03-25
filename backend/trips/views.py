from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import DriverLog as Log, Trip
from .serializers import TripSerializer, LogSerializer
from .services import get_route_details, calculate_trip_details, calculate_stops, check_compliance
from datetime import timedelta, date
import logging

logger = logging.getLogger("django")


@api_view(['POST'])
def create_trip(request):
    serializer = TripSerializer(data=request.data)
    if serializer.is_valid():
        trip = serializer.save()

        route_data = get_route_details(trip.current_location, trip.pickup_location, trip.dropoff_location)
        driving_hours, total_hours, total_miles = calculate_trip_details(
            route_data, trip.cycle_hours
        )

        fuel_stops, rest_stops, fuel_locations, rest_locations = calculate_stops(
            total_miles, total_hours, route_data["routes"][0]["geometry"])

        log_entries = []
        start_date = date.today()
        remaining_driving = driving_hours
        cycle_remaining = 70 - trip.cycle_hours
        prev_day_ended_early = False

        day = 0
        while remaining_driving > 0 and day < 8:
            # Calculate driving hours for the day
            driving = min(11, remaining_driving, cycle_remaining)
            on_duty = min(14, driving + 2)  # 2h for inspections/loading
            
            # Determine sleeper berth/off-duty split
            if day == 0:
                # First day doesn't need sleeper berth
                sleeper_berth = 0
                off_duty = 24 - on_duty
            else:
                # Use split sleeper berth if driving > 8 hours or previous day ended early
                if driving > 8 or prev_day_ended_early:
                    sleeper_berth = 8
                    off_duty = 2
                    prev_day_ended_early = False
                else:
                    sleeper_berth = 0
                    off_duty = 24 - on_duty
                    # If we finish early, mark for split next day
                    if driving < 8 and remaining_driving - driving > 0:
                        prev_day_ended_early = True

            log_entry = Log.objects.create(
                trip=trip,
                date=start_date + timedelta(days=day),
                driving_hours=driving,
                on_duty_hours=on_duty,
                off_duty_hours=off_duty,
                sleeper_berth_hours=sleeper_berth
            )
            log_entries.append(log_entry)

            remaining_driving -= driving
            cycle_remaining -= driving
            day += 1

            # Check for 34-hour restart opportunity
            if day >= 2 and sum(log.driving_hours for log in log_entries[-2:]) >= 20:
                # Add 34-hour restart period
                restart_entry = Log.objects.create(
                    trip=trip,
                    date=start_date + timedelta(days=day),
                    driving_hours=0,
                    on_duty_hours=0,
                    off_duty_hours=10,
                    sleeper_berth_hours=34
                )
                log_entries.append(restart_entry)
                day += 2  # Skip next 2 days for restart
                cycle_remaining = 70  # Reset cycle

        check_compliance(trip)

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
