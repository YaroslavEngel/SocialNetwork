from django.views.generic import TemplateView
from django.views import View
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.http import HttpRequest, JsonResponse
from django.urls import reverse
from django.core.mail import send_mail

from django.contrib.auth.models import User

import random
import json

from .forms import RegistrationForm, LoginForm


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

            return JsonResponse({
                'message': 'User Created'
            })

        return JsonResponse({
            'error': form.errors.get_json_data()
        })


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

        return JsonResponse({
            "error": login_form.errors.get_json_data()
        })


class LogoutView(View):
    def get(self, request):
        logout(request)
        return redirect('auth-form')  # вот сюда


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

            send_mail(
                'Код подтверждения',
                f'Ваш код: {code}',
                None,
                [email],
            )

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