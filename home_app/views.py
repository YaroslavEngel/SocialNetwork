from django.shortcuts import render
from post_app.forms import PostForm
from post_app.models import Post

def render_home(request):
    form = PostForm()
    posts = Post.objects.all().order_by('-created_at').prefetch_related('images', 'tags', 'urls', 'likes', 'hearts', 'views')
    return render(request, 'home_app/home.html', {'post_form': form, 'posts': posts})