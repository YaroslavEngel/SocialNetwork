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
        context["personal_chats"] = Chat.objects.filter(
            users=self.request.user, is_group=False
        ).order_by("id")
        group_chats = Chat.objects.filter(
            users=self.request.user, is_group=True
        ).order_by("id")
        group_chats_data = []
        for chat in group_chats:
            last_msg = Message.objects.filter(chat=chat).select_related("sender").order_by("-created_at").first()
            group_chats_data.append({"chat": chat, "last_message": last_msg})
        context["group_chats"] = group_chats_data
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
        return JsonResponse({
            "success": True,
            "chat_id": chat.id,
            "username": display_name(other_user),
        })


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
        chat = Chat.objects.create(name=name, is_group=True, admin=request.user)
        chat.users.add(request.user)
        chat.users.add(*User.objects.filter(id__in=friend_ids))
        return JsonResponse({"success": True, "chat_id": chat.id, "name": chat.name})