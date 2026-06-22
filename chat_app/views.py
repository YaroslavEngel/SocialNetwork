from itertools import groupby
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.views import View
from django.views.generic import TemplateView

from user_app.models import User
from user_app.utils.friend_queries import get_users_by_section
from .models import Chat, Message


def display_name(user):
    return user.username or user.email


class ChatView(LoginRequiredMixin, TemplateView):
    login_url = "auth"
    template_name = "chat_app/chat.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        friends_qs = get_users_by_section(self.request.user, "friends").order_by("username", "email")
        friends_grouped = []
        for letter, group in groupby(friends_qs, key=lambda u: (u.username or u.email)[0].upper()):
            friends_grouped.append({"letter": letter, "friends": list(group)})
        context["friends"] = friends_qs
        context["friends_grouped"] = friends_grouped

        personal_chats_qs = Chat.objects.filter(
            users=self.request.user, is_group=False
        )
        personal_chats_data = []
        for chat in personal_chats_qs:
            other_user = chat.users.exclude(id=self.request.user.id).first()
            last_msg = (
                Message.objects.filter(chat=chat)
                .select_related("sender")
                .order_by("-created_at")
                .first()
            )
            unread_count = (
                Message.objects.filter(chat=chat)
                .exclude(sender=self.request.user)
                .exclude(readers=self.request.user)
                .count()
            )
            personal_chats_data.append({
                "chat": chat,
                "other_user": other_user,
                "last_message": last_msg,
                "unread_count": unread_count,
            })
        personal_chats_data.sort(
            key=lambda x: (
                -(x["unread_count"] > 0),
                -(x["last_message"].created_at.timestamp() if x["last_message"] else 0),
            )
        )
        context["personal_chats"] = personal_chats_data

        group_chats_qs = Chat.objects.filter(
            users=self.request.user, is_group=True
        )
        group_chats_data = []
        for chat in group_chats_qs:
            last_msg = (
                Message.objects.filter(chat=chat)
                .select_related("sender")
                .order_by("-created_at")
                .first()
            )
            unread_count = (
                Message.objects.filter(chat=chat)
                .exclude(sender=self.request.user)
                .exclude(readers=self.request.user)
                .count()
            )
            group_chats_data.append({
                "chat": chat,
                "last_message": last_msg,
                "unread_count": unread_count,
            })
        group_chats_data.sort(
            key=lambda x: (
                -(x["unread_count"] > 0),
                -(x["last_message"].created_at.timestamp() if x["last_message"] else 0),
            )
        )
        context["group_chats"] = group_chats_data
        context["group_total_unread"] = sum(item["unread_count"] for item in group_chats_data)
        return context


class ChatWithView(LoginRequiredMixin, View):
    login_url = "auth"

    def post(self, request, user_id):
        other_user = User.objects.get(id=user_id)
        friends = get_users_by_section(request.user, "friends")
        if other_user not in friends:
            return JsonResponse({"success": False}, status=403)
        chat_ids = Chat.objects.filter(
            users=request.user, is_group=False
        ).values_list("id", flat=True)
        chat = Chat.objects.filter(
            id__in=chat_ids, users=other_user, is_group=False
        ).first()
        if chat is None:
            chat = Chat.objects.create(is_group=False)
            chat.users.add(request.user, other_user)

        unread = Message.objects.filter(chat=chat).exclude(
            sender=request.user
        ).exclude(readers=request.user)
        for msg in unread:
            msg.readers.add(request.user)

        return JsonResponse({
            "success": True,
            "chat_id": chat.id,
            "username": display_name(other_user),
        })


class MarkChatReadView(LoginRequiredMixin, View):
    """Marks all unread messages in a chat (personal or group) as read for the current user."""
    login_url = "auth"

    def post(self, request, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id, users=request.user)
        except Chat.DoesNotExist:
            return JsonResponse({"success": False}, status=403)

        unread = Message.objects.filter(chat=chat).exclude(
            sender=request.user
        ).exclude(readers=request.user)
        for msg in unread:
            msg.readers.add(request.user)

        return JsonResponse({"success": True})


class MessageHistoryView(LoginRequiredMixin, View):
    login_url = "auth"

    def get(self, request, chat_id):
        if not Chat.objects.filter(id=chat_id, users=request.user).exists():
            return JsonResponse({"success": False}, status=403)
        query = Message.objects.filter(chat_id=chat_id).select_related(
            "sender"
        ).prefetch_related("images").order_by("-created_at", "-id")
        page_obj = Paginator(query, 10).get_page(request.GET.get("page", 1))
        messages = list(page_obj.object_list)[::-1]
        return JsonResponse({
            "messages": [{
                "id": m.id,
                "text": m.text,
                "sender": display_name(m.sender),
                "created_at": m.created_at.isoformat(),
                "images": [mi.image.url for mi in m.images.all()],
            } for m in messages],
            "has_next": page_obj.has_next(),
        })


class CreateGroupView(LoginRequiredMixin, View):
    login_url = "auth"

    def post(self, request):
        name = request.POST.get("name", "").strip()
        if not name:
            return JsonResponse({"success": False, "error": "name_required"}, status=400)
        user_ids = request.POST.getlist("users")
        friend_ids = get_users_by_section(request.user, "friends").filter(
            id__in=user_ids
        ).values_list("id", flat=True)

        avatar_file = request.FILES.get("avatar")

        chat = Chat.objects.create(
            name=name,
            is_group=True,
            admin=request.user,
            avatar=avatar_file
        )
        chat.users.add(request.user)
        chat.users.add(*User.objects.filter(id__in=friend_ids))
        return JsonResponse({
            "success": True,
            "chat_id": chat.id,
            "name": chat.name,
            "avatar_url": chat.avatar.url if chat.avatar else None,
        })


class GroupInfoView(LoginRequiredMixin, View):
    login_url = "auth"

    def get(self, request, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id, users=request.user, is_group=True)
        except Chat.DoesNotExist:
            return JsonResponse({"success": False}, status=403)
        return JsonResponse({
            "success": True,
            "is_admin": chat.admin == request.user,
        })


class LeaveGroupView(LoginRequiredMixin, View):
    login_url = "auth"

    def post(self, request, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id, users=request.user, is_group=True)
        except Chat.DoesNotExist:
            return JsonResponse({"success": False}, status=403)

        if chat.admin == request.user:
            return JsonResponse({"success": False, "error": "admin_cannot_leave"}, status=400)

        chat.users.remove(request.user)
        return JsonResponse({"success": True})


class DeleteGroupView(LoginRequiredMixin, View):
    login_url = "auth"

    def post(self, request, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id, is_group=True)
        except Chat.DoesNotExist:
            return JsonResponse({"success": False}, status=404)

        if chat.admin != request.user:
            return JsonResponse({"success": False, "error": "not_admin"}, status=403)

        chat.delete()
        return JsonResponse({"success": True})


class EditGroupView(LoginRequiredMixin, View):
    login_url = "auth"

    def get(self, request, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id, users=request.user, is_group=True)
        except Chat.DoesNotExist:
            return JsonResponse({"success": False}, status=403)
        members = [{"id": u.id, "name": display_name(u), "avatar": u.avatar.url if hasattr(u, "avatar") and u.avatar else None} for u in chat.users.all()]
        return JsonResponse({
            "success": True,
            "name": chat.name,
            "avatar_url": chat.avatar.url if chat.avatar else None,
            "members": members,
            "is_admin": chat.admin == request.user,
        })

    def post(self, request, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id, users=request.user, is_group=True)
        except Chat.DoesNotExist:
            return JsonResponse({"success": False}, status=403)
        if chat.admin != request.user:
            return JsonResponse({"success": False, "error": "not_admin"}, status=403)

        name = request.POST.get("name", "").strip()
        if name:
            chat.name = name

        if "avatar" in request.FILES:
            chat.avatar = request.FILES["avatar"]

        remove_users = request.POST.getlist("remove_users")
        if remove_users:
            chat.users.remove(*User.objects.filter(id__in=remove_users).exclude(id=request.user.id))

        add_users = request.POST.getlist("add_users")
        if add_users:
            friends = get_users_by_section(request.user, "friends").filter(id__in=add_users)
            chat.users.add(*friends)

        chat.save()
        return JsonResponse({
            "success": True,
            "name": chat.name,
            "avatar_url": chat.avatar.url if chat.avatar else None,
        })