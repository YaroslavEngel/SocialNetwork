# Імпортуємо функцію для отримання активної моделі користувача.
from django.contrib.auth import get_user_model

# Імпортуємо модуль моделей Django.
from django.db import models


# Зберігаємо активну модель користувача в коротку змінну.
User = get_user_model()


# Описуємо модель чату між користувачами.
class Chat(models.Model):
    # Зберігаємо учасників чату.
    users = models.ManyToManyField(User, related_name="chats")
    # Зберігаємо назву чату, якщо вона потрібна.
    name = models.CharField(max_length=30, blank=True, null=True)
    # Позначаємо, чи є чат груповим.
    is_group = models.BooleanField(default=False)
    # Зберігаємо аватар групового чату, якщо він потрібен.
    avatar = models.ImageField(upload_to="grou_avatars/", blank=True, null=True)
    # Зберігаємо адміністратора групового чату, якщо він потрібен.
    admin = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)

    # Повертаємо коротку назву чату для адмінки.
    def str(self):
        # Показуємо назву або id чату.
        return self.name or f"Chat {self.id}"


# Описуємо модель одного повідомлення в чаті.
class Message(models.Model):
    # Зберігаємо текст повідомлення.
    text = models.TextField()
    # Зберігаємо чат, у якому написали повідомлення.
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    # Зберігаємо автора повідомлення.
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    # Зберігаємо користувачів, які прочитали повідомлення.
    readers = models.ManyToManyField(User, blank=True, related_name="read_messages")
    # Зберігаємо дату й час створення повідомлення.
    created_at = models.DateTimeField(auto_now_add=True)  

    # Повертаємо короткий текст повідомлення для адмінки.
    def str(self):
        # Показуємо перші 30 символів повідомлення.
        return self.text[:30]


# Описуємо модель зображення, яке прикріплене до повідомлення.
class MessageImage(models.Model):
    # Зберігаємо повідомлення, до якого прив'язане зображення.
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="images")
    # Зберігаємо файл зображення у папці chat_images.
    image = models.ImageField(upload_to="chat_images/")

    # Повертаємо короткий опис зображення для адмінки.
    def str(self):
        # Показуємо id повідомлення, до якого належить зображення.
        return f"Image for message {self.message_id}"