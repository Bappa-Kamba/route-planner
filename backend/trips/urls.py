from django.urls import path
from .views import create_trip, get_all_trips, get_trip_by_id


urlpatterns = [
    path('api/trip/', create_trip, name="create-trip"),
    path('api/trips/', get_all_trips, name="get_all_trips"),
    path('api/trips/<int:trip_id>/', get_trip_by_id, name="get_trip_by_id"),

]
