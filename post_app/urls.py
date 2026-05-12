from django.urls import path
from .views import PostPageView, CreateTagView, PostListView

urlpatterns = [
    path('', PostPageView.as_view(), name='post'),
    path('posts', PostListView.as_view(), name='post_list'),
    path('create-tag/', CreateTagView.as_view(), name='create-tag'),
]