from rest_framework import serializers
from .models import *
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

class StudentListSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email")
    profile_image = serializers.ImageField(source="user.profile_image")

    class Meta:
        model = Student
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "profile_image",
            "studying_level",
            "responsible_phone",
        ]

class LecturerListSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email")
    profile_image = serializers.ImageField(source="user.profile_image")
    phone_number = serializers.CharField(source="user.phone_number")

    class Meta:
        model = Lecturer
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "profile_image",
            "specialty",
            "experience",
            "phone_number"
        ]

class StaffListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = [
            "id",
            "first_name",
            "last_name",
            "personal_image",
            "duty",
            "phone_number",
            "salary",
            "is_active"
        ]


