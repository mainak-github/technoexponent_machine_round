from django.urls import path

from .views import ConfirmBookingView, CreateHoldView, EventView


urlpatterns = [
    path(
        "events/<int:event_id>/",
        EventView.as_view(),
    ),
    path(
        "events/<int:event_id>/hold/",
        CreateHoldView.as_view(),
    ),
    path(
        "holds/<int:hold_id>/confirm/",
        ConfirmBookingView.as_view(),
    ),
]