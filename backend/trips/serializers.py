from rest_framework import serializers
from .models import Trip, DriverLog


class TripSerializer(serializers.ModelSerializer):
    compliance_status = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = '__all__'

    def get_compliance_status(self, obj):
        return {
            'cycle_remaining': obj.cycle_hours_remaining,
            'violations': obj.violations,
            'cycle_start': obj.cycle_start_date
        }

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverLog
        fields = '__all__'
