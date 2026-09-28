import json

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Event
from .services import get_available_seats


class EventConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.event_id = self.scope["url_route"]["kwargs"]["event_id"]
        self.group_name = f"event_{self.event_id}"

        event_exists = await self.event_exists()

        if not event_exists:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )

        await self.accept()

        available_seats = await self.get_available_seats()

        await self.send_json(
            {
                "type": "availability",
                "event_id": self.event_id,
                "available_seats": available_seats,
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name,
        )

    async def availability_update(self, event):
        await self.send_json(
            {
                "type": "availability",
                "event_id": event["event_id"],
                "available_seats": event["available_seats"],
            }
        )

    @database_sync_to_async
    def event_exists(self):
        return Event.objects.filter(id=self.event_id).exists()

    @database_sync_to_async
    def get_available_seats(self):
        event = Event.objects.get(id=self.event_id)
        return get_available_seats(event)