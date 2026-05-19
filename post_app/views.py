from urllib import request

from django.shortcuts import render
from django.views import View
from django.views.generic import ListView
from django.contrib.auth.mixins import LoginRequiredMixin
from .forms import PostForm
from .models import Post, Tag
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.template.loader import render_to_string


class PostPageView(LoginRequiredMixin, View):
    def get(self, request):
        form = PostForm()
        return render(request, 'post_app/post.html', {'post_form': form})

    def post(self, request):
        links = request.POST.getlist('links')
        images = request.FILES.getlist('image')

        form = PostForm(
            request.POST,
            request.FILES,
            links=links,
            images=images
        )
        if form.is_valid():
            post = form.save(author=request.user)
            return JsonResponse({
                'message': 'Created',
                'post': {
                    'title': post.title,
                    'content': post.content,
                    'author': post.author.username,
                    'avatar': post.author.avatar.url if hasattr(post.author, 'avatar') and post.author.avatar else '',
                    'tags': [tag.name for tag in post.tags.all()],
                    'links': [link.url for link in post.urls.all()],
                    'images': [img.compressed_image.url for img in post.images.all()],
                }
            })

        return JsonResponse({'error': form.errors}, status=400)


class PostListView(LoginRequiredMixin, ListView):
    model = Post
    context_object_name = 'posts'
    template_name = 'post_app/post.html'
    paginate_by = 3

    def get_queryset(self):
        return Post.objects.filter(author=self.request.user).order_by('-created_at').prefetch_related('images', 'tags', 'urls', 'likes', 'hearts', 'views')


    def get(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            queryset = self.get_queryset()
            paginate = Paginator(queryset, self.paginate_by)
            page_number = request.GET.get('page', 1)  # ← добавь default=1

            if int(page_number) > paginate.num_pages:
                return JsonResponse({'success': False})

            posts = paginate.get_page(page_number)

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


class CreateTagView(LoginRequiredMixin, View):
    def post(self, request):
        import json
        data = json.loads(request.body)
        name = data.get('name', '').strip().lstrip('#')

        if not name:
            return JsonResponse({'error': 'Назва обовязкова'}, status=400)

        tag, created = Tag.objects.get_or_create(name=name)
        return JsonResponse({'id': tag.id, 'name': tag.name})
    
class DeletePostView(LoginRequiredMixin, View):
    def post(self, request, pk):
        post = Post.objects.filter(pk=pk, author=request.user).first()
        if not post:
            return JsonResponse({'error': 'Не знайдено'}, status=404)
        post.delete()
        return JsonResponse({'message': 'Deleted'})