from datetime import timedelta
from .socket import send_availability

from django.db import models, transaction
from django.utils import timezone

from .models import Booking, Event, SeatHold
from .redis_client import redis_client


def get_available_seats(event):
    now = timezone.now()

    confirmed_seats = Booking.objects.filter(
        event=event
    ).aggregate(
        total=models.Sum("quantity")
    )["total"] or 0

    active_hold_seats = SeatHold.objects.filter(
        event=event,
        status=SeatHold.Status.ACTIVE,
        expires_at__gt=now,
    ).aggregate(
        total=models.Sum("quantity")
    )["total"] or 0

    return event.total_seats - confirmed_seats - active_hold_seats


def create_hold(
    event_id,
    user_identifier,
    quantity,
):
    if quantity <= 0:
        raise ValueError(
            "Quantity must be greater than 0"
        )

    with transaction.atomic():
        event = (
            Event.objects
            .select_for_update()
            .get(id=event_id)
        )

        available_seats = get_available_seats(
            event
        )

        if quantity > available_seats:
            raise ValueError(
                "Not enough seats available"
            )

        expires_at = (
            timezone.now()
            + timedelta(minutes=2)
        )

        hold = SeatHold.objects.create(
            event=event,
            user_identifier=user_identifier,
            quantity=quantity,
            expires_at=expires_at,
            status=SeatHold.Status.ACTIVE,
        )

        redis_client.set(
            f"hold:{hold.id}",
            user_identifier,
            ex=120,
        )

        new_available_seats = (
            available_seats - quantity
        )

    send_availability(
        event.id,
        new_available_seats,
    )

    return hold


def confirm_hold(hold_id, user_identifier):
    with transaction.atomic():
        hold = (
            SeatHold.objects
            .select_for_update()
            .select_related("event")
            .get(id=hold_id)
        )

        if hold.user_identifier != user_identifier:
            raise ValueError(
                "This hold does not belong to this user"
            )

        if hold.status != SeatHold.Status.ACTIVE:
            raise ValueError(
                "This hold is no longer active"
            )

        if hold.expires_at <= timezone.now():
            hold.status = SeatHold.Status.EXPIRED
            hold.save(
                update_fields=["status"]
            )

            raise ValueError(
                "This hold has expired"
            )

        booking = Booking.objects.create(
            event=hold.event,
            user_identifier=user_identifier,
            quantity=hold.quantity,
        )

        hold.status = SeatHold.Status.CONFIRMED

        hold.save(
            update_fields=["status"]
        )

        redis_client.delete(
            f"hold:{hold.id}"
        )

        available_seats = get_available_seats(
            hold.event
        )

    # Transaction has successfully committed.
    send_availability(
        hold.event.id,
        available_seats,
    )

    return booking

def create_hold(event_id, user_identifier, quantity):
    if quantity <= 0:
        raise ValueError("Quantity must be greater than 0")

    with transaction.atomic():
        event = Event.objects.select_for_update().get(id=event_id)

        available_seats = get_available_seats(event)

        if quantity > available_seats:
            raise ValueError("Not enough seats available")

        expires_at = timezone.now() + timedelta(minutes=2)

        hold = SeatHold.objects.create(
            event=event,
            user_identifier=user_identifier,
            quantity=quantity,
            expires_at=expires_at,
            status=SeatHold.Status.ACTIVE,
        )

        redis_client.set(
            f"hold:{hold.id}",
            user_identifier,
            ex=120,
        )

        new_available_seats = available_seats - quantity

    send_availability(
        event.id,
        new_available_seats,
    )

    return hold