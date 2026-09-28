from rest_framework import serializers

from .models import Booking, Event, SeatHold
from .services import get_available_seats


class EventSerializer(serializers.ModelSerializer):
    available_seats = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "name",
            "total_seats",
            "available_seats",
        ]

    def get_available_seats(self, event):
        return get_available_seats(event)


class HoldSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeatHold
        fields = [
            "id",
            "event",
            "user_identifier",
            "quantity",
            "expires_at",
            "status",
        ]


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "id",
            "event",
            "user_identifier",
            "quantity",
            "created_at",
        ]