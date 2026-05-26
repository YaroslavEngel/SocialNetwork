from django.views.generic import TemplateView
from django.views import View
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.http import HttpRequest, JsonResponse
from django.urls import reverse
from django.core.mail import send_mail
from django.contrib.auth.mixins import LoginRequiredMixin

import random
import json

from .forms import RegistrationForm, LoginForm

from django.contrib.auth import get_user_model
from django.core.paginator import Paginator
from django.template.loader import render_to_string
from .utils import get_users_by_section, friend_request, friend_reject, friend_accept, friend_delete, friend_add_direct

User = get_user_model()


class RegisterPageView(TemplateView):
    template_name = 'user_app/auth.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['register_form'] = RegistrationForm()
        context['login_form'] = LoginForm()
        return context


class RegisterView(View):
    def post(self, request: HttpRequest):
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResponse({'message': 'User Created'})
        return JsonResponse({'error': form.errors.get_json_data()})


class LoginView(View):
    def post(self, request):
        login_form = LoginForm(request.POST)
        if login_form.is_valid():
            user = login_form.user
            login(request, user)
            return JsonResponse({
                "message": "Login Success",
                "redirect_url": reverse("home"),
                "first_login": not user.username
            })
        return JsonResponse({"error": login_form.errors.get_json_data()})


class LogoutView(View):
    def get(self, request):
        logout(request)
        return redirect('auth-form')


class RegisterFormView(View):
    def get(self, request):
        return render(request, 'user_app/particles/form_register.html', {
            'register_form': RegistrationForm()
        })


class LoginFormView(View):
    def get(self, request):
        return render(request, 'user_app/particles/form_login.html', {
            'login_form': LoginForm()
        })


class ConfirmEmailFormView(View):
    def get(self, request):
        return render(request, 'user_app/particles/form_confirm_email.html')


class SendConfirmCodeView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            if not email:
                return JsonResponse({'error': 'Email required'}, status=400)
            code = str(random.randint(100000, 999999))
            request.session['confirm_code'] = code
            request.session['confirm_email'] = email
            send_mail('Код підтвердження', f'Ваш код: {code}', None, [email])
            return JsonResponse({'message': 'Code sent'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class VerifyCodeView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            code = data.get('code')
            session_code = request.session.get('confirm_code')
            if not session_code:
                return JsonResponse({'error': 'Session expired'}, status=400)
            if code == session_code:
                request.session.pop('confirm_code', None)
                return JsonResponse({'message': 'Verified'})
            return JsonResponse({'error': 'Invalid code'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class FirstLoginView(View):
    def post(self, request):
        user = request.user
        username = request.POST.get("username")
        pseudonym = request.POST.get("pseudonym")
        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already exists"})
        user.username = username
        user.first_name = pseudonym
        user.save()
        return JsonResponse({"message": "Saved"})


class FriendsView(LoginRequiredMixin, TemplateView):
    template_name = 'user_app/friends.html'
    login_url = '/auth-form/'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        hidden_ids = self.request.session.get('hidden_recommendations', [])
        context['sections'] = {
            'requests': {
                'title': 'Запити',
                'users': get_users_by_section(self.request.user, 'requests')[:3]
            },
            'recommendations': {
                'title': 'Рекомендації',
                'users': get_users_by_section(self.request.user, 'recommendations', hidden_ids=hidden_ids)[:6]
            },
            'friends': {
                'title': 'Друзі',
                'users': get_users_by_section(self.request.user, 'friends')[:6]
            },
        }
        return context


class FriendsSectionView(LoginRequiredMixin, View):
    login_url = '/auth-form/'

    def get(self, request, section):
        hidden_ids = request.session.get('hidden_recommendations', [])
        users = get_users_by_section(request.user, section, hidden_ids=hidden_ids)

        preview = request.GET.get('preview')
        if preview:
            limit = 3 if section == 'requests' else 6
            paginate = Paginator(users, limit).get_page(1)
            html = render_to_string(
                'user_app/particles/friends/friend_cards.html',
                {'users': paginate.object_list, 'section': section},
                request=request
            )
            return JsonResponse({'html': html, 'has_next': False})

        page_size = 9 if section == 'requests' else 6
        paginate = Paginator(users, page_size).get_page(request.GET.get("page", 1))
        html = render_to_string(
            'user_app/particles/friends/friend_cards.html',
            {'users': paginate.object_list, 'section': section},
            request=request
        )
        return JsonResponse({'html': html, 'has_next': paginate.has_next()})


class FriendActionView(LoginRequiredMixin, View):
    login_url = '/auth-form/'
    actions = {
        'request': friend_request,
        'reject':  friend_reject,
        'accept':  friend_accept,
        'delete':  friend_delete,
        'add':     friend_add_direct,
    }

    def post(self, request, action):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            data = request.POST

        other_user = User.objects.get(id=data.get('user_id'))

        if action == 'hide':
            hidden = request.session.get('hidden_recommendations', [])
            if other_user.id not in hidden:
                hidden.append(other_user.id)
                request.session['hidden_recommendations'] = hidden
                request.session.modified = True
            if request.META.get('HTTP_X_REQUESTED_WITH') != 'XMLHttpRequest':
                return redirect('/friends/')
            return JsonResponse({'remove': True})

        if action == 'delete':
            result = friend_delete(request.user, other_user)
            hidden = request.session.get('hidden_recommendations', [])
            if other_user.id in hidden:
                hidden.remove(other_user.id)
                request.session['hidden_recommendations'] = hidden
                request.session.modified = True
            if request.META.get('HTTP_X_REQUESTED_WITH') != 'XMLHttpRequest':
                return redirect('/friends/')
            return JsonResponse(result)

        fn = self.actions.get(action)
        if not fn:
            return JsonResponse({'error': 'Unknown action'}, status=400)
        result = fn(request.user, other_user)
        if request.META.get('HTTP_X_REQUESTED_WITH') != 'XMLHttpRequest':
            return redirect('/friends/')
        return JsonResponse(result)


class UserProfileView(LoginRequiredMixin, View):
    login_url = '/auth-form/'

    def get(self, request, user_id):
        profile_user = User.objects.get(id=user_id)
        posts = profile_user.user.all().order_by('-created_at')

        requests_ids = [u.id for u in get_users_by_section(request.user, 'requests')]
        friends_ids = [u.id for u in get_users_by_section(request.user, 'friends')]

        if profile_user == request.user:
            relation = 'self'
        elif profile_user.id in requests_ids:
            relation = 'incoming_request'
        elif profile_user.id in friends_ids:
            relation = 'friend'
        else:
            relation = 'stranger'
        posts_count = profile_user.user.count()
        friends_count = get_users_by_section(profile_user, 'friends').count()

        return render(request, 'user_app/user_profile.html', {
            'profile_user': profile_user,
            'posts': posts,
            'relation': relation,
            'posts_count': posts_count,
            'friends_count': friends_count,
        })