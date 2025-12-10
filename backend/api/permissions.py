from rest_framework.permissions import BasePermission

class IsInstitution(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'institution'

class IsLecturer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'lecturer'

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'student'

class IsVerified(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated 
            and user.is_verified is True
        )
    
class CanPay(BasePermission):
    """
    Students can pay only if they are verified 
    AND have a Stripe customer ID stored.
    """
    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            return False

        if user.user_type != "student":
            return False

        if not user.is_verified:
            return False

        student = getattr(user, "student", None)
        if student is None:
            return False

        return bool(student.stripe_customer_id)

class CanReceive(BasePermission):
    """
    Institutions can receive payments only if verified
    AND they have a connected Stripe account.
    """
    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            return False

        if user.user_type != "institution":
            return False

        if not user.is_verified:
            return False

        institution = getattr(user, "institution", None)
        if institution is None:
            return False

        return bool(institution.stripe_account_id)

