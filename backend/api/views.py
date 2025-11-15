from .serializers import *
from .models import *
from .permissions import *
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
import random
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.generics import ListAPIView
from ai.predict_doc import classify_document

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

class IsVerifiedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "success": True,
            "is_verified": request.user.is_verified
        })

class DocumentCheckView(APIView):
    def post(self, request):
        if "file" not in request.FILES:
            return Response({"error": "No file uploaded"}, status=400)

        file = request.FILES["file"]

        doc_score, nondoc_score = classify_document(file)

        return Response({
            "document_percentage": round(doc_score * 100, 2),
            "nondocument_percentage": round(nondoc_score * 100, 2),
            "is_document": doc_score >= 0.70
        })

class InstitutionTotalStudentsView(APIView):
    permission_classes = [IsInstitution]

    def get(self, request):
        institution = Institution.objects.get(user=request.user)
        total_students = institution.students.count()

        return Response({
            "success": True,
            "total_students": total_students
        })
    
class InstitutionTotalLecturersView(APIView):
    permission_classes = [IsInstitution]

    def get(self, request):
        institution = Institution.objects.get(user=request.user)
        total_lecturers = institution.lecturers.count()

        return Response({
            "success": True,
            "total_lecturers": total_lecturers
        })
    
class InstitutionTotalStaffView(APIView):
    permission_classes = [IsInstitution]

    def get(self, request):
        institution = Institution.objects.get(user=request.user)
        total_staff = institution.staff.count()

        return Response({
            "success": True,
            "total_staff": total_staff
        })
    
class InstitutionActiveStudentsView(APIView):
    permission_classes = [IsInstitution]

    def get(self, request):
        institution = Institution.objects.get(user=request.user)
        today = timezone.now().date()

        active_courses = institution.courses.filter(
            starting_date__lte=today,
            ending_date__gte=today
        )

        active_students = Student.objects.filter(
            courses__in=active_courses
        ).distinct().count()

        return Response({
            "success": True,
            "active_students": active_students
        })
    
class InstitutionActiveLecturersView(APIView):
    permission_classes = [IsInstitution]

    def get(self, request):
        institution = Institution.objects.get(user=request.user)
        today = timezone.now().date()

        active_lecturers = Lecturer.objects.filter(
            courses__institution=institution,
            courses__starting_date__lte=today,
            courses__ending_date__gte=today
        ).distinct().count()

        return Response({
            "success": True,
            "active_lecturers": active_lecturers
        })

class InstitutionActiveStaffView(APIView):
    permission_classes = [IsInstitution]

    def get(self, request):
        institution = Institution.objects.get(user=request.user)

        active_staff = Staff.objects.filter(
            institution=institution,
            is_active=True
        ).count()

        return Response({
            "success": True,
            "active_staff": active_staff
        })
    
class InstitutionStudentsListView(ListAPIView):
    serializer_class = StudentListSerializer
    permission_classes = [IsInstitution]

    def get_queryset(self):
        user = self.request.user
        institution = Institution.objects.get(user=user)

        qs = Student.objects.filter(institutions=institution).distinct()

        studying_level = self.request.query_params.get("studying_level")
        active = self.request.query_params.get("active")

        if studying_level:
            qs = qs.filter(studying_level=studying_level)

        if active is not None:
            today = timezone.now().date()

            active_courses = Course.objects.filter(
                institution=institution,
                starting_date__lte=today,
                ending_date__gte=today
            )

            if active.lower() == "true":
                qs = qs.filter(courses__in=active_courses).distinct()
            elif active.lower() == "false":
                qs = qs.exclude(courses__in=active_courses).distinct()

        return qs

class InstitutionLecturersListView(ListAPIView):
    serializer_class = LecturerListSerializer
    permission_classes = [IsInstitution]

    def get_queryset(self):
        user = self.request.user
        institution = Institution.objects.get(user=user)

        return Lecturer.objects.filter(institutions=institution).distinct()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        institution = Institution.objects.get(user=request.user)
        today = timezone.now().date()

        active_courses = Course.objects.filter(
            institution=institution,
            starting_date__lte=today,
            ending_date__gte=today
        )

        active_lecturer_ids = set(
            active_courses.values_list("lecturer_id", flat=True)
        )

        for item in response.data["results"]:
            item["active"] = item["id"] in active_lecturer_ids

        return response

class InstitutionStaffListView(ListAPIView):
    serializer_class = StaffListSerializer
    permission_classes = [IsInstitution]

    def get_queryset(self):
        user = self.request.user
        institution = Institution.objects.get(user=user)

        return Staff.objects.filter(institution=institution).distinct()

class InstitutionWeeklyScheduleView(APIView):
    permission_classes = [IsInstitution]

    def get(self, request):
        institution = Institution.objects.get(user=request.user)

        courses = institution.courses.select_related("lecturer", "lecturer__user")

        week = {
            "monday": [],
            "tuesday": [],
            "wednesday": [],
            "thursday": [],
            "friday": [],
            "saturday": [],
            "sunday": [],
        }

        for course in courses:
            for day in course.days:
                week[day].append({
                    "course_title": course.title,
                    "lecturer": f"{course.lecturer.user.first_name} {course.lecturer.user.last_name}",
                    "start_time": course.start_time.strftime("%H:%M"),
                    "end_time": course.end_time.strftime("%H:%M"),
                    "course_id": course.id,
                })

        for day in week:
            week[day] = sorted(week[day], key=lambda x: x["start_time"])

        return Response({
            "success": True,
            "schedule": week
        })

class InstitutionVerificationView(APIView):
    permission_classes = [IsInstitution]

    def put(self, request):
        user = request.user

        serializer = InstitutionVerificationSerializer(
            user, 
            data=request.data, 
            partial=False,
            context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Institution account verified successfully.",
                "is_verified": True
            })

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class InstitutionEditProfileView(APIView):
    permission_classes = [IsInstitution, IsVerified]

    def put(self, request):
        user = request.user

        serializer = InstitutionEditProfileSerializer(
            user,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Institution profile updated successfully."
            })

        return Response({"success": False, "errors": serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST)





