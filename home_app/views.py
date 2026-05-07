from django.shortcuts import render
from post_app.forms import PostForm

def render_home(request):
    form = PostForm()
    return render(request, 'home_app/home.html', {'post_form': form})