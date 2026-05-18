from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def render_friends(request):
    return render(request, 'friends_app/friends.html')