'''
Файл для налаштування маршрутизації для WebSocket-з'єднання.
Цей файл є аналогом urls.py, тільки для налаштування маршрутизації для WebSocket-з'єднання.
'''
from django.urls import path
from .consumers import ChatConsumer

# Список з маршрутами
websockets_urlpatterns = [
    path('chat/', ChatConsumer.as_asgi()) # "Підв'язка" логіки роботи чату з url "chat/"
]