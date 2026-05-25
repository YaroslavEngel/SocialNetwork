from django.urls import path
from .views import (
    RegisterPageView,
    RegisterView,
    LoginView,
    LogoutView,
    RegisterFormView,
    LoginFormView,
    ConfirmEmailFormView,
    SendConfirmCodeView,
    VerifyCodeView,
    FirstLoginView,
    FriendsView,
    FriendsSectionView,
    FriendActionView,
    UserProfileView
)

urlpatterns = [
    path('auth-form/', RegisterPageView.as_view(), name='auth-form'),

    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),

    path('form/register/', RegisterFormView.as_view(), name='form-register'),
    path('form/login/', LoginFormView.as_view(), name='form-login'),
    path('form/confirm-email/', ConfirmEmailFormView.as_view(), name='form-confirm-email'),

    path('send-code/', SendConfirmCodeView.as_view(), name='send-code'),
    path('verify-code/', VerifyCodeView.as_view(), name='verify-code'),
    path('first-login/', FirstLoginView.as_view(), name='first-login'),

    path('', FriendsView.as_view(), name='friends'),
    path('section/<str:section>/', FriendsSectionView.as_view(), name='friends-section'),
    path('action/<str:action>/', FriendActionView.as_view(), name='friend-action'),
    
    path('profile/<int:user_id>/', UserProfileView.as_view(), name='user-profile'),
]