from django.shortcuts import render, redirect
from django.views import View
from .forms import PostForm
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from .models import Tag
from django.http import JsonResponse


class PostPageView(View):
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
            form.save(author=request.user)
            return JsonResponse({'message': 'Created'})

        return JsonResponse({'error': form.errors}, status=400)

class CreateTagView(View):
    def post(self, request):
        import json
        data = json.loads(request.body)
        name = data.get('name', '').strip().lstrip('#')
        
        if not name:
            return JsonResponse({'error': 'Назва обовязкова'}, status=400)
        
        tag, created = Tag.objects.get_or_create(name=name)
        return JsonResponse({'id': tag.id, 'name': tag.name})