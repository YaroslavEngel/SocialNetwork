from django.urls import path
from .views import DeletePostView, PostPageView, CreateTagView, PostListView

urlpatterns = [
    path('', PostListView.as_view(), name='post_list'),
    path('create/', PostPageView.as_view(), name='post_create'),
    path('create-tag/', CreateTagView.as_view(), name='create-tag'),
    path('delete/<int:pk>/', DeletePostView.as_view(), name='post_delete'),
]
