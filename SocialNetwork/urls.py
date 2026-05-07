from django.contrib import admin
from django.urls import path, include
from home_app.views import render_home
from friends_app.views import render_friends
from post_app.views import PostPageView
from django.conf.urls.static import static
from .settings import MEDIA_URL, MEDIA_ROOT, DEBUG

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', render_home, name='home'),
    path('friends/', render_friends, name='friends'),
    path('post/', include('post_app.urls')),
    path('user/', include('user_app.urls')),
    path('post/', PostPageView.as_view(), name='post'),
]

if DEBUG:
    urlpatterns += static(
        MEDIA_URL,
        document_root=MEDIA_ROOT,
        null=True
    )