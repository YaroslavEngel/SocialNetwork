from django.contrib import admin
from django.urls import path, include
from home_app.views import render_home
from friends_app.views import render_friends
from post_app.views import render_posts

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', render_home, name='home'),
    path('friends/', render_friends, name='friends'),
    path('post/', render_posts, name='post'),
    path('user/', include('user_app.urls')),
]