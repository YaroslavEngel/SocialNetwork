from django.urls import path

from .views import (
    ChatView, ChatWithView, CreateGroupView, MessageHistoryView,
    GroupInfoView, LeaveGroupView, DeleteGroupView, EditGroupView,
    MarkChatReadView,
)

urlpatterns = [
    path("", ChatView.as_view(), name="chat"),
    path("chat_with/<int:user_id>/", ChatWithView.as_view(), name="chat_with"),
    path("<int:chat_id>/messages/", MessageHistoryView.as_view(), name="message_history"),
    path("create_group/", CreateGroupView.as_view(), name="create_group"),
    path("<int:chat_id>/group_info/", GroupInfoView.as_view(), name="group_info"),
    path("<int:chat_id>/leave_group/", LeaveGroupView.as_view(), name="leave_group"),
    path("<int:chat_id>/delete_group/", DeleteGroupView.as_view(), name="delete_group"),
    path("<int:chat_id>/edit_group/", EditGroupView.as_view(), name="edit_group"),
    path("<int:chat_id>/mark_read/", MarkChatReadView.as_view(), name="mark_chat_read"),
]