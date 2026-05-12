from django.contrib import admin
from django.urls import path, include
from friends_app.views import render_friends
from django.conf.urls.static import static
from .settings import MEDIA_URL, MEDIA_ROOT, DEBUG

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('home_app.urls')),
    path('friends/', render_friends, name='friends'),
    path('post/', include('post_app.urls')),
    path('user/', include('user_app.urls')),
]

if DEBUG:
    urlpatterns += static(
        MEDIA_URL,
        document_root=MEDIA_ROOT,
    )