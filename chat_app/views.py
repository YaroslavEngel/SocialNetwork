from django.shortcuts import render

# Create your views here.
from django.contrib.auth.mixins import LoginRequiredMixin

from django.http import JsonResponse

from django.views import View
from django.views.generic import TemplateView

from user_app.models import User
from user_app.utils.friends_filter import get_users_by_section
from .models import Chat


class ChatView(LoginRequiredMixin, TemplateView):
    login_url = "auth"
    template_name = "chat.html"
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["friends"] = get_users_by_section(self.request.user, "friends")
        context["personal_chat"] = Chat.objects.filter(users=self.request.user, is_group=False)
        return context

class ChatCreateView(View):
    def post(self, request, userId):
        second_user = User.objects.get(id=userId)
        friends = get_users_by_section(self.request.user, "friends")
        if second_user not in friends:
            return JsonResponse({"success": False}, status=403)
        user_chat_ids = Chat.objects.filter(users=request.user, is_group=False).values_list("id", flat=True)
        chat = Chat.objects.filter(id__in=user_chat_ids, users=second_user, is_group=False).first()
        if chat is None:
            chat = Chat.objects.create(is_group=False)
            chat.users.add(request.user, second_user)
        return JsonResponse({"success": True, "chat_id": chat.id, "username": chat.username }, status=201)