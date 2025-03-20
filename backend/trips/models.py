from django.db import models
import uuid


class Trip(models.Model):
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    cycle_hours = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip from {self.pickup_location} to {self.dropoff_location}"


# class Route(models.Model):
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     trip = models.ForeignKey(
#         Trip, related_name='routes', on_delete=models.CASCADE)
#     step_number = models.IntegerField()
#     location_name = models.CharField(max_length=255)
#     latitude = models.FloatField()
#     longitude = models.FloatField()
#     stop_type = models.CharField(max_length=50, choices=[(
#         'fuel', 'Fuel'), ('rest', 'Rest'), ('pickup', 'Pickup'), ('dropoff', 'Dropoff')])
#     timestamp = models.DateTimeField()


class DriverLog(models.Model):
    trip = models.ForeignKey(Trip, related_name='logs',
                             on_delete=models.CASCADE)
    date = models.DateField()
    off_duty_hours = models.FloatField()
    sleeper_berth_hours = models.FloatField()
    driving_hours = models.FloatField()
    on_duty_hours = models.FloatField()
