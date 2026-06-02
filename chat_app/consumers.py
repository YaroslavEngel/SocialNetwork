import json
import base64
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.files.base import ContentFile
from .models import Chat, Message
from user_app.models import User


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.chat_id = self.scope["url_route"]["kwargs"]["chat_id"]
        self.room_group_name = f"chat_{self.chat_id}"
        self.user = self.scope["user"]

        if not await self.user_in_chat():
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_text = data.get("message", "").strip()
        image_base64 = data.get("image", None)
        print("RECEIVE text:", message_text, "image:", bool(image_base64))

        if not message_text and not image_base64:
            return

        message = await self.save_message(message_text, image_base64)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "text": message_text,
                "sender": self.user.email,
                "id": message.id,
                "image": image_base64,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "text": event["text"],
            "sender": event["sender"],
            "id": event["id"],
            "image": event.get("image"),
        }))

    @database_sync_to_async
    def user_in_chat(self):
        return Chat.objects.filter(id=self.chat_id, users=self.user).exists()

    @database_sync_to_async
    def save_message(self, text, image_base64=None):
        chat = Chat.objects.get(id=self.chat_id)
        message = Message(chat=chat, sender=self.user, text=text)
        if image_base64:
            fmt, imgstr = image_base64.split(';base64,')
            ext = fmt.split('/')[-1]
            message.image.save(
                f"msg_{self.user.id}.{ext}",
                ContentFile(base64.b64decode(imgstr)),
                save=False
            )
        message.save()
        return message
