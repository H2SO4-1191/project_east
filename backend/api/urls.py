from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('registration/signup/', SignupView.as_view(), name='signup'),
    path('registration/login/', LoginView.as_view(), name='login'),
    path('registration/otp/', OTPView.as_view(), name='otp'),
    path('registration/is-verified/', IsVerifiedView.as_view(), name='isverified'),
    path('registration/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('ai/doc/', DocumentCheckView.as_view(), name='aidoc'),
    path('institution/total-students/', InstitutionTotalStudentsView.as_view(), name='totalstudents'),
    path('institution/total-lecturers/', InstitutionTotalLecturersView.as_view(), name='totallecturers'),
    path('institution/total-staff/', InstitutionTotalStaffView.as_view(), name='totalstaff'),
    path('institution/active-students/', InstitutionActiveStudentsView.as_view(), name='activestudents'),
    path('institution/active-lecturers/', InstitutionActiveLecturersView.as_view(), name='activelecturers'),
    path('institution/active-staff/', InstitutionActiveStaffView.as_view(), name='activestaff'),
    path('institution/students-list/', InstitutionStudentsListView.as_view(), name='studentslist'),
    path('institution/lecturers-list/', InstitutionLecturersListView.as_view(), name='lecturerslist'),
    path('institution/staff-list/', InstitutionStaffListView.as_view(), name='stafflist'),
    path('institution/schedule/', InstitutionWeeklyScheduleView.as_view(), name='institutionschedule'),
    path('institution/institution-verify/', InstitutionVerificationView.as_view(), name='institutionverify'),
    path('institution/institution-edit/', InstitutionEditProfileView.as_view(), name='institutionedit'),




]
