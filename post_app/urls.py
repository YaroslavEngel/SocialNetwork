from django.urls import path
from .views import PostPageView , CreateTagView

urlpatterns = [
    path('', PostPageView.as_view(), name='post'),
    path('create-tag/', CreateTagView.as_view(), name='create-tag'),
]