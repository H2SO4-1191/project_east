from rest_framework.permissions import BasePermission

class IsInstitution(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'institution'

class IsVerified(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated 
            and user.is_verified is True
        )