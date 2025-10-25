from .serializers import *
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

class SignupView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "success": True,
                "user_id": user.id, # type: ignore
                "message": "User signup successful"
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "message": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)