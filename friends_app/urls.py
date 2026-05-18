from django.urls import path
from .views import render_friends

urlpatterns = [
    path('', render_friends, name='friends'),
]