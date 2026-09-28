from django.db import models
from django.utils import timezone
from datetime import timedelta


class Event(models.Model):
    name = models.CharField(max_length=200)
    total_seats = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class SeatHold(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        CONFIRMED = "CONFIRMED", "Confirmed"
        EXPIRED = "EXPIRED", "Expired"

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="holds",
    )
    user_identifier = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    expires_at = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return self.expires_at <= timezone.now()

    def __str__(self):
        return f"Hold {self.id} - {self.user_identifier}"


class Booking(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="bookings",
    )
    user_identifier = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking {self.id} - {self.user_identifier}"