from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.views import View
from django.views.generic import TemplateView

from user_app.models import User
from user_app.utils.friend_queries import get_users_by_section

from .models import Chat, Message


class ChatView(LoginRequiredMixin, TemplateView):
    login_url = "auth"
    template_name = "chat_app/chat.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["friends"] = get_users_by_section(self.request.user, "friends")
        context["personal_chats"] = Chat.objects.filter(users=self.request.user, is_group=False).order_by("id")
        context["group_chats"] = Chat.objects.filter(users=self.request.user, is_group=True).order_by("id")
        return context


class ChatWithView(LoginRequiredMixin, View):
    login_url = "auth"

    def post(self, request, user_id):
        other_user = User.objects.get(id=user_id)
        friends = get_users_by_section(request.user, "friends")
        if other_user not in friends:
            return JsonResponse({"success": False}, status=403)
        chat_ids = Chat.objects.filter(users=request.user, is_group=False).values_list("id", flat=True)
        chat = Chat.objects.filter(id__in=chat_ids, users=other_user, is_group=False).first()
        if chat is None:
            chat = Chat.objects.create(is_group=False)
            chat.users.add(request.user, other_user)
        return JsonResponse({"success": True, "chat_id": chat.id, "username": other_user.email})

class MessageHistoryView(View, LoginRequiredMixin):
    def get(self,request, chat_id):
        if not Chat.objects.filter(id= chat_id, users = request.user).exists():
            return JsonResponse({"success": False}, status=403)
        messages_in_chat = Message.objects.filter(chat_id = chat_id).select_related("sender").order_by("-created_at", "-id") 
        page_object= Paginator(messages_in_chat, 10).get_page(request.GET.get("page", 1))
        messages = list(page_object.object_list)[::-1]
        return JsonResponse({
            "messages": [{
                "id": message.id,
                "text": message.text,
                "sender": message.sender.email
            } for message in messages],
            "has_next": page_object.has_next()
        })
                                                                                    

class CreateGroupView(LoginRequiredMixin, View):
    login_url = "auth"

    def post(self, request):
        name = request.POST.get("name")
        user_ids = request.POST.getlist("users")
        friends_ids = get_users_by_section(request.user, "friends").filter(id__in = user_ids).values_list("id", flat=True)
        chat = Chat.objects.create(name = name, is_group = True, admin = request.user)
        chat.users.add(request.user)
        chat.users.add(*User.objects.filter(id__int = friends_ids))
        return JsonResponse({"succes": True, "chat_id": chat.id, "name": chat.name})