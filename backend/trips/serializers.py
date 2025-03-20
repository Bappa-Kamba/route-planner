from rest_framework import serializers
from .models import Trip, DriverLog


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = '__all__'

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverLog
        fields = '__all__'
