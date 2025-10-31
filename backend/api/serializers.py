from rest_framework import serializers
from .models import User
from django.utils import timezone
from datetime import timedelta

class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'user_type']
    def create(self, validated_data):
        user = User.objects.create(**validated_data)
        user.set_unusable_password()
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def validate_email(self, value):
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email not found.")
        return value

class OTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)
    def validate(self, data):
        try:
            user = User.objects.get(email__iexact=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "Email not found."})
        if user.otp_code != data['otp_code'].strip():
            raise serializers.ValidationError({"otp_code": "Invalid OTP code."})
        if not user.otp_generated or timezone.now() - user.otp_generated > timedelta(minutes=5):
            raise serializers.ValidationError({"otp_code": "OTP code expired."})
        data['user'] = user
        return data
