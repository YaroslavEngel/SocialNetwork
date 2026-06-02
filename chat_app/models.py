from django.contrib.auth import get_user_model
from django.db import models


User = get_user_model()


class Chat(models.Model):
    users = models.ManyToManyField(User, related_name="chats")
    name = models.CharField(max_length=30, blank=True, null=True)
    is_group = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to="chat_avatars/", blank=True, null=True)
    admin = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)

    def str(self):
        return self.name or f"Chat {self.id}"


class Message(models.Model):
    text = models.TextField()
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    readers = models.ManyToManyField(User, blank=True, related_name="read_messages")
    created_at = models.DateTimeField(auto_now_add=True)

    def str(self):
        return self.text[:30]