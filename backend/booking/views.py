from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event, SeatHold
from .serializers import BookingSerializer, EventSerializer, HoldSerializer
from .services import confirm_hold, create_hold


class EventView(APIView):

    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)

        serializer = EventSerializer(event)

        return Response(serializer.data)


class CreateHoldView(APIView):

    def post(self, request, event_id):
        user_identifier = request.data.get("user_identifier")
        quantity = request.data.get("quantity")

        if not user_identifier:
            return Response(
                {"error": "user_identifier is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not quantity:
            return Response(
                {"error": "quantity is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"error": "quantity must be a number"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            hold = create_hold(
                event_id=event_id,
                user_identifier=user_identifier,
                quantity=quantity,
            )

        except Event.DoesNotExist:
            return Response(
                {"error": "Event not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        except ValueError as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = HoldSerializer(hold)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class ConfirmBookingView(APIView):

    def post(self, request, hold_id):
        user_identifier = request.data.get("user_identifier")

        if not user_identifier:
            return Response(
                {"error": "user_identifier is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            booking = confirm_hold(
                hold_id=hold_id,
                user_identifier=user_identifier,
            )

        except ValueError as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_409_CONFLICT,
            )

        except Exception:
            return Response(
                {"error": "Hold not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = BookingSerializer(booking)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )