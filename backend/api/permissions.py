from rest_framework.permissions import BasePermission

class IsInstitution(BasePermission):
    message = "Only institutions can access this endpoint."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'institution'


class IsLecturer(BasePermission):
    message = "Only lecturers can access this endpoint."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'lecturer'


class IsStudent(BasePermission):
    message = "Only students can access this endpoint."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'student'


class IsVerified(BasePermission):
    message = "Your account must be verified first."

    def has_permission(self, request, view):
        user = request.user
        return user.is_authenticated and user.is_verified is True


class CanPay(BasePermission):
    """
    Students can pay only if they are verified AND have a Stripe customer ID.
    """
    message = "You must add a payment method before making payments."

    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            self.message = "You must be logged in."
            return False

        if user.user_type != "student":
            self.message = "Only students can make payments."
            return False

        if not user.is_verified:
            self.message = "Your account must be verified before paying."
            return False

        student = getattr(user, "student", None)
        if student is None:
            self.message = "Student profile not found."
            return False

        if not student.stripe_customer_id:
            self.message = "No payment method found. Please add one."
            return False

        return True


class CanReceive(BasePermission):
    """
    Institutions can receive payments only if verified AND have a connected account.
    """
    message = "You must complete payout setup before receiving payments."

    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            self.message = "You must be logged in."
            return False

        if user.user_type != "institution":
            self.message = "Only institutions can receive payments."
            return False

        if not user.is_verified:
            self.message = "Verify your account to receive payments."
            return False

        institution = getattr(user, "institution", None)
        if institution is None:
            self.message = "Institution profile not found."
            return False

        if not institution.stripe_account_id:
            self.message = "You must connect your Stripe payout account first."
            return False

        return True


class IsSubscribed(BasePermission):
    message = "You must have an active subscription to use this feature."

    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            self.message = "You must be logged in."
            return False

        if user.user_type != "institution":
            self.message = "Only institutions have subscriptions."
            return False

        institution = getattr(user, "institution", None)
        if institution is None:
            self.message = "Institution profile not found."
            return False

        subscription = getattr(institution, "subscription", None)
        if subscription is None:
            self.message = "You do not have a subscription."
            return False

        if not subscription.is_active:
            self.message = "Your subscription is not active."
            return False

        return True
