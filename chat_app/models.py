from django.db import models

# Create your models here.

# Імпортуємо функцію для отримання поточної моделі користувача.
from django.contrib.auth import get_user_model

# Імпортуємо Django-модулі для опису моделей.
from django.db import models


# Отримуємо поточну модель користувача.
User = get_user_model()


# Описуємо модель одного особистого або групового чату.
class Chat(models.Model):
    # Зберігаємо всіх користувачів чату.
    users = models.ManyToManyField(User, related_name="chats")
    # Зберігаємо назву чату, якщо вона потрібна.
    name = models.CharField(max_length=30, blank=True, null=True)
    # Позначаємо, чи є чат груповим.
    is_group = models.BooleanField(default=False)
    # Зберігаємо аватар групового чату.
    avatar = models.ImageField(upload_to="chat_avatars/", blank=True, null=True)
    # Зберігаємо адміністратора групи.
    admin = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)

    # Повертаємо короткий текст для адмін-панелі.
    def str(self):
        # Показуємо назву або id чату.
        return self.name or f"Chat {self.id}"