from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def send_availability(event_id, available_seats):
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f"event_{event_id}",
        {
            "type": "availability_update",
            "event_id": event_id,
            "available_seats": available_seats,
        },
    )