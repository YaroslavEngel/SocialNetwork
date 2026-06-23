import json
import base64
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.files.base import ContentFile
from .models import Chat, Message, MessageImage
from user_app.models import User


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.chat_id = self.scope["url_route"]["kwargs"]["chat_id"]
        self.room_group_name = f"chat_{self.chat_id}"
        self.user = self.scope["user"]

        if not await self.user_in_chat():
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_text = data.get("message", "").strip()
        image_base64 = data.get("image", None)

        if not message_text and not image_base64:
            return

        message, image_url = await self.save_message(message_text, image_base64)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "text": message_text,
                "sender": self.user.username or self.user.email,
                "id": message.id,
                "created_at": message.created_at.isoformat(),
                "images": [image_url] if image_url else [],
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "text": event["text"],
            "sender": event["sender"],
            "id": event["id"],
            "created_at": event.get("created_at"),
            "images": event.get("images", []),
        }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence_update",
            "user_id": event["user_id"],
            "is_online": event["is_online"],
        }))

    @database_sync_to_async
    def user_in_chat(self):
        return Chat.objects.filter(id=self.chat_id, users=self.user).exists()

    @database_sync_to_async
    def save_message(self, text, image_base64=None):
        chat = Chat.objects.get(id=self.chat_id)
        message = Message.objects.create(chat=chat, sender=self.user, text=text)
        image_url = None
        if image_base64:
            fmt, imgstr = image_base64.split(';base64,')
            ext = fmt.split('/')[-1]
            image_file = ContentFile(
                base64.b64decode(imgstr),
                name=f"msg_{self.user.id}.{ext}"
            )
            msg_image = MessageImage.objects.create(message=message, image=image_file)
            image_url = msg_image.image.url
        return message, image_url


class PresenceConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f"presence_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Ставим онлайн и уведомляем друзей
        await self.set_online(True)
        await self.notify_friends_status(True)

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            # Ставим оффлайн и уведомляем друзей
            await self.set_online(False)
            await self.notify_friends_status(False)
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence_update",
            "user_id": event["user_id"],
            "is_online": event["is_online"],
        }))

    @database_sync_to_async
    def set_online(self, status: bool):
        User.objects.filter(id=self.user.id).update(is_online=status)

    @database_sync_to_async
    def get_friend_ids(self):
        from user_app.utils.friend_queries import get_users_by_section
        return list(
            get_users_by_section(self.user, "friends").values_list("id", flat=True)
        )

    async def notify_friends_status(self, is_online: bool):
        friend_ids = await self.get_friend_ids()
        for friend_id in friend_ids:
            await self.channel_layer.group_send(
                f"presence_{friend_id}",
                {
                    "type": "presence_update",
                    "user_id": self.user.id,
                    "is_online": is_online,
                }
            )