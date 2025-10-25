from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('otp/', OTPView.as_view(), name='otp'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
]