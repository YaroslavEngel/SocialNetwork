from django.shortcuts import render
from django.views.generic import ListView
from django.contrib.auth.mixins import LoginRequiredMixin
from post_app.forms import PostForm
from post_app.models import Post
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.template.loader import render_to_string
from chat_app.models import Chat, Message
from user_app.models import Friendship


class HomeListView(LoginRequiredMixin, ListView):
    model = Post
    context_object_name = 'posts'
    template_name = 'home_app/home.html'
    paginate_by = 3

    def get_queryset(self):
        return Post.objects.all().order_by('-created_at').prefetch_related('images', 'tags', 'urls', 'likes', 'hearts', 'views')

    def get(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            queryset = self.get_queryset()
            paginate = Paginator(queryset, self.paginate_by)
            page_number = request.GET.get('page', 1)
            posts = paginate.get_page(page_number)

            try:
                page_number = int(page_number)
            except (ValueError, TypeError):
                page_number = 1

            if page_number > paginate.num_pages:
                return JsonResponse({'success': False})

            return JsonResponse({
                'success': True,
                'html': render_to_string(
                    template_name='post_app/posts.html',
                    context={'posts': posts}
                )
            })

        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['post_form'] = PostForm()

        friend_requests = Friendship.objects.filter(
            to_user=self.request.user,
            status='pending'
        ).select_related('from_user').order_by('-created_at')[:3]
        context['friend_requests'] = friend_requests
        context['friend_requests_count'] = Friendship.objects.filter(
            to_user=self.request.user,
            status='pending'
        ).count()
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

        context["personal_chats"] = personal_chats_data[:3]
        # total_unread теперь приходит из context processor (chat_app.context_processors.unread_messages)

        return context