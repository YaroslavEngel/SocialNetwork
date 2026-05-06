from django.shortcuts import render

# Create your views here.

def render_friends(request):
    return render(request, 'friends_app/friends.html')