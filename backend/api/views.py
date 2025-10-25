from .serializers import *
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import random
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

class SignupView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "success": True,
                "user_id": user.id,
                "message": "Account registered successfully."
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = User.objects.get(email__iexact=serializer.validated_data['email'])
            if user.otp_generated and timezone.now() - user.otp_generated < timedelta(minutes=3):
                remaining = 180 - (timezone.now() - user.otp_generated).seconds
                return Response({
                    "success": False,
                    "message": f"An OTP code had been already sent to {user.email}, try again after {remaining} seconds."
                }, status=status.HTTP_400_BAD_REQUEST)
            otp = f"{random.randint(100000, 999999)}"
            user.otp_code = otp
            user.otp_generated = timezone.now()
            user.save()
            send_mail(
                subject='رمز تسجيل الدخول',
                message=f'رمز تسجيل الدخول الخاص بك هو\n\n{otp}\n\nسوف تنتهي صلاحية الرمز بعد 5 دقائق.',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
            )
            return Response({"success": True, "message": f"An OTP code had been sent throught email to '{user.email}'"})
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
class OTPView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = OTPSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.otp_code = None
            user.otp_generated = None
            user.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "success": True,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user_id": user.id,
                "user_type": user.user_type
            })
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)