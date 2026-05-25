import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from chat_app import routing


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'messenger.settings')

# Об'єкт з налаштуваннями додатку
application = ProtocolTypeRouter({
    # Якщо це HTTP-запит — обробляється стандартним Django ASGI-додатком
    'http': get_asgi_application(),
    # Якщо це WebSocket-запит —  URLRouter перенаправляє WebSocket-запити згідно з шаблонами у routing.py
    'websocket': URLRouter(
            routing.websockets_urlpatterns
    )
})