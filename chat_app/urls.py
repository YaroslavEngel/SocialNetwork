from django.urls import path
from .views import ChatView, ChatCreateView

urlpatterns = [
    path('', ChatView.as_view(), name='chat'),
    path('chat_with/<int:userId>/', ChatCreateView.as_view(), name='chat_create'),
]