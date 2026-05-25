from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from .settings import MEDIA_URL, MEDIA_ROOT, DEBUG

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('home_app.urls')),
    path('post/', include('post_app.urls')),
    path('user/', include('user_app.urls')),
    path('friends/', include('user_app.urls')),
    path('chat/', include('chat_app.urls')),
]

if DEBUG:
    urlpatterns += static(
        MEDIA_URL,
        document_root=MEDIA_ROOT,
    )