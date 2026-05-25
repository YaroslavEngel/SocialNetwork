from django.shortcuts import render
from django.views.generic import ListView
from django.contrib.auth.mixins import LoginRequiredMixin
from post_app.forms import PostForm
from post_app.models import Post
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.template.loader import render_to_string


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
        return context