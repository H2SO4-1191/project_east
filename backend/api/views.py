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
from ai_util.predict_doc import classify_document
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
import datetime
import stripe

class FeedPagination(PageNumberPagination):
    page_size = 20

class HomeFeedView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        city = None
        keywords = []

        if user:
            city = user.city
            if user.user_type == "student":
                k = user.student.interesting_keywords
                if k:
                    keywords = [x.strip().lower() for x in k.split(",")]
            elif user.user_type == "lecturer":
                k = user.lecturer.skills
                if k:
                    keywords = [x.strip().lower() for x in k.split(",")]

        # --- GET POSTS ---
        posts = Post.objects.all()
        if city:
            posts_city = posts.filter(user__city=city)
        else:
            posts_city = posts.none()

        posts_global = posts.exclude(id__in=posts_city.values_list("id", flat=True))

        # --- GET COURSES ---
        courses = Course.objects.select_related("institution", "lecturer__user")
        if city:
            courses_city = courses.filter(institution__user__city=city)
        else:
            courses_city = courses.none()

        courses_kw = courses.none()
        if user and user.user_type == "student" and keywords:
            for kw in keywords:
                courses_kw = courses_kw | courses.filter(title__icontains=kw)

        courses_global = courses.exclude(id__in=courses_city.values_list("id", flat=True))

        # --- GET JOBS ---
        jobs = JobPost.objects.select_related("institution__user")
        if city:
            jobs_city = jobs.filter(institution__user__city=city)
        else:
            jobs_city = jobs.none()

        jobs_kw = jobs.none()
        if user and user.user_type == "lecturer" and keywords:
            for kw in keywords:
                jobs_kw = jobs_kw | jobs.filter(
                    models.Q(title__icontains=kw) |
                    models.Q(description__icontains=kw) |
                    models.Q(skills_required__icontains=kw)
                )

        jobs_global = jobs.exclude(id__in=jobs_city.values_list("id", flat=True))

        # --- WEIGHT LOGIC ---
        if not user:
            post_pick = posts.order_by("?")[:10]
            course_pick = courses.order_by("?")[:10]
            job_pick = jobs.order_by("?")[:10]

        else:
            if user.user_type == "student":
                post_pick = list(posts_city[:5]) + list(posts_global[:3])
                course_pick = list(courses_kw[:10]) + list(courses_city[:8])
                job_pick = list(jobs_global[:2])

            elif user.user_type == "lecturer":
                post_pick = list(posts_city[:4]) + list(posts_global[:3])
                course_pick = list(courses_global[:4])
                job_pick = list(jobs_kw[:10]) + list(jobs_city[:6])

            else:  # institution
                post_pick = list(posts_city[:12]) + list(posts_global[:6])
                course_pick = list(courses_city[:4])
                job_pick = list(jobs_global[:3])

        # --- COMBINE ---
        feed = []

        # normalize POSTS
        for p in post_pick:
            feed.append({
                "type": "post",
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "image": p.images.first().image.url if p.images.exists() else None,
                "created_at": p.created_at,

                "publisher_id": p.user.id,
                "publisher_username": p.user.username,
                "publisher_profile_image": (
                    p.user.profile_image.url if p.user.profile_image else None
                ),
            })

        # normalize COURSES
        for c in course_pick:
            feed.append({
                "type": "course",
                "id": c.id,
                "title": c.title,
                "description": c.about,
                "image": c.course_image.url if c.course_image else None,
                "created_at": datetime.datetime.combine(c.starting_date, datetime.time.min),

                "publisher_id": c.institution.user.id,
                "publisher_username": c.institution.user.username,
                "publisher_profile_image": (
                    c.institution.user.profile_image.url if c.institution.user.profile_image else None
                ),
            })

        # normalize JOBS
        for j in job_pick:
            feed.append({
                "type": "job",
                "id": j.id,
                "title": j.title,
                "description": j.description,
                "image": None,
                "created_at": j.created_at,

                "publisher_id": j.institution.user.id,
                "publisher_username": j.institution.user.username,
                "publisher_profile_image": (
                    j.institution.user.profile_image.url if j.institution.user.profile_image else None
                ),
            })

        # SHUFFLE
        random.shuffle(feed)

        # PAGINATE
        paginator = FeedPagination()
        page = paginator.paginate_queryset(feed, request)
        serializer = FeedItemSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

class SignupView(APIView):
    permission_classes = [AllowAny]
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
    permission_classes = [IsAuthenticated]

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
                    "starting_date": course.starting_date,
                    "ending_date": course.ending_date,
                })

        for day in week:
            week[day] = sorted(week[day], key=lambda x: x["start_time"])

        return Response({
            "success": True,
            "schedule": week
        })

class InstitutionVerificationView(APIView):
    permission_classes = [IsAuthenticated, IsInstitution]

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

class InstitiutionCreatePostView(APIView):
    permission_classes = [IsInstitution, IsVerified, IsSubscribed]

    def post(self, request):
        serializer = PostCreateSerializer(data=request.data)

        if serializer.is_valid():
            post = serializer.save(user=request.user)
            return Response({
                "success": True,
                "message": "Post created successfully.",
                "post_id": post.id
            }, status=status.HTTP_201_CREATED)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class InstitutionCreateCourseView(APIView):
    permission_classes = [IsInstitution, IsVerified, CanReceive, IsSubscribed]

    def post(self, request):
        serializer = CourseSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            course = serializer.save()
            return Response({
                "success": True,
                "message": "Course created successfully.",
                "course_id": course.id
            }, status=status.HTTP_201_CREATED)

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class InstitutionEditCourseView(APIView):
    permission_classes = [IsInstitution, IsVerified]

    def put(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id, institution=request.user.institution)
        except Course.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = CourseSerializer(course, data=request.data, partial=True, context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Course updated successfully."
            })

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class InstitutionSelfProfileView(APIView):
    permission_classes = [IsInstitution]

    def get(self, request):
        serializer = InstitutionSelfProfileSerializer(request.user)
        return Response({"success": True, "data": serializer.data})

class InstitutionPublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username, user_type="institution")
        except User.DoesNotExist:
            return Response({"success": False, "message": "Institution not found"}, status=404)

        serializer = InstitutionPublicProfileSerializer(user)
        return Response({"success": True, "data": serializer.data})

class InstitutionCoursesView(ListAPIView):
    serializer_class = InstitutionCourseListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        try:
            user = User.objects.get(username=self.kwargs["username"], user_type="institution")
        except User.DoesNotExist:
            return Course.objects.none()

        institution = user.institution
        return institution.courses.all().order_by("-id")

class InstitutionPostsView(ListAPIView):
    serializer_class = InstitutionPostListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        try:
            user = User.objects.get(username=self.kwargs["username"], user_type="institution")
        except User.DoesNotExist:
            return Post.objects.none()

        return Post.objects.filter(user=user).order_by("-id")

class InstitutionViewStudentProfile(APIView):
    permission_classes = [IsInstitution]

    def get(self, request, student_id):
        institution = request.user.institution

        try:
            student = Student.objects.get(
                id=student_id,
                courses__institution=institution
            )
        except Student.DoesNotExist:
            return Response({"success": False, "message": "Student not found or not enrolled in your courses."}, status=404)

        serializer = InstitutionViewStudentSerializer(student.user)
        return Response({"success": True, "data": serializer.data})

class InstitutionViewLecturerProfile(APIView):
    permission_classes = [IsInstitution]

    def get(self, request, lecturer_id):
        institution = request.user.institution

        try:
            lecturer = Lecturer.objects.get(
                id=lecturer_id,
                courses__institution=institution
            )
        except Lecturer.DoesNotExist:
            return Response({"success": False, "message": "Lecturer not found or not teaching in your institution."}, status=404)

        serializer = InstitutionViewLecturerSerializer(lecturer.user)
        return Response({"success": True, "data": serializer.data})

class InstitutionAddMarkerView(APIView):
    permission_classes = [IsInstitution, IsVerified, IsSubscribed]

    def post(self, request):
        institution = request.user.institution
        lecturer_id = request.data.get("lecturer_id")

        if not lecturer_id:
            return Response({"success": False, "message": "lecturer_id required"}, status=400)

        try:
            lecturer = Lecturer.objects.get(id=lecturer_id)
        except Lecturer.DoesNotExist:
            return Response({"success": False, "message": "Lecturer not found"}, status=404)

        institution.marked_lecturers.add(lecturer)

        return Response({"success": True, "message": "Lecturer marked successfully."})

class InstitutionMarkedLecturersView(APIView):
    permission_classes = [IsInstitution, IsVerified]

    def get(self, request):
        institution = request.user.institution

        # IDs of lecturers who teach in institution courses
        course_lecturer_ids = set(
            Lecturer.objects.filter(
                courses__institution=institution
            ).values_list("id", flat=True)
        )

        # IDs of manually marked lecturers
        marked_ids = set(
            institution.marked_lecturers.values_list("id", flat=True)
        )

        # Combine without duplicates
        all_ids = course_lecturer_ids | marked_ids

        # Final queryset
        lecturers = Lecturer.objects.filter(id__in=all_ids)

        serializer = LecturerSimpleSerializer(lecturers, many=True)
        return Response({"success": True, "lecturers": serializer.data})

class InstitutionIsMarkedView(APIView):
    permission_classes = [IsInstitution, IsVerified]

    def get(self, request, lecturer_id):
        institution = request.user.institution

        # Check if lecturer exists
        try:
            lecturer = Lecturer.objects.get(id=lecturer_id)
        except Lecturer.DoesNotExist:
            return Response({
                "success": False,
                "message": "Lecturer not found."
            }, status=404)

        # Check if marked
        is_marked = institution.marked_lecturers.filter(id=lecturer_id).exists()

        return Response({
            "success": True,
            "marked": is_marked
        })

class InstitutionRemoveMarkerView(APIView):
    permission_classes = [IsInstitution, IsVerified]

    def delete(self, request, lecturer_id):
        institution = request.user.institution

        # check lecturer exists
        try:
            lecturer = Lecturer.objects.get(id=lecturer_id)
        except Lecturer.DoesNotExist:
            return Response({
                "success": False,
                "message": "Lecturer not found."
            }, status=404)

        # if not marked, nothing to remove
        if not institution.marked_lecturers.filter(id=lecturer_id).exists():
            return Response({
                "success": True,
                "message": "Lecturer was not marked."
            })

        # remove
        institution.marked_lecturers.remove(lecturer)

        return Response({
            "success": True,
            "message": "Lecturer removed from marked list."
        })

class CourseDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({
                "success": False,
                "message": "Course not found."
            }, status=404)

        serializer = CourseDetailSerializer(course)
        return Response({"success": True, "data": serializer.data})

class InstitutionCreateJobView(APIView):
    permission_classes = [IsInstitution, IsVerified, IsSubscribed]

    def post(self, request):
        serializer = JobPostSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            job = serializer.save()
            return Response({
                "success": True,
                "message": "Job post created successfully.",
                "job_id": job.id
            }, status=201)

        return Response({"success": False, "errors": serializer.errors}, status=400)

class InstitutionJobsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username, user_type="institution")
        except User.DoesNotExist:
            return Response({"success": False, "message": "Institution not found"}, status=404)

        jobs = user.institution.jobs.order_by("-created_at")
        serializer = JobPostSerializer(jobs, many=True)
        return Response({"success": True, "data": serializer.data})

class JobDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, job_id):
        try:
            job = JobPost.objects.get(id=job_id)
        except JobPost.DoesNotExist:
            return Response({"success": False, "message": "Job not found"}, status=404)

        serializer = JobPostSerializer(job)
        return Response({"success": True, "data": serializer.data})

class InstitutionJobApplicationsView(APIView):
    permission_classes = [IsInstitution, IsVerified]

    def get(self, request, job_id):
        institution = request.user.institution

        try:
            job = JobPost.objects.get(id=job_id, institution=institution)
        except JobPost.DoesNotExist:
            return Response({"success": False, "message": "Job not found."}, status=404)

        applications = job.applications.select_related("lecturer", "lecturer__user")

        data = []
        for app in applications:
            lec = app.lecturer.user
            data.append({
                "application_id": app.id,
                "lecturer_id": app.lecturer.id,
                "username": lec.username,
                "first_name": lec.first_name,
                "last_name": lec.last_name,
                "email": lec.email,
                "phone_number": lec.phone_number,
                "specialty": app.lecturer.specialty,
                "experience": app.lecturer.experience,
                "skills": app.lecturer.skills,
                "message": app.message,
                "applied_at": app.created_at,
            })

        return Response({"success": True, "applications": data})

class InstitutionCourseAttendanceSummaryView(APIView):
    permission_classes = [IsInstitution]

    def get(self, request, course_id):
        institution = request.user.institution

        try:
            course = Course.objects.get(id=course_id, institution=institution)
        except Course.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)

        students = Student.objects.filter(courses=course).select_related("user")

        summary = []

        for student in students:
            student_atts = Attendance.objects.filter(course=course, student=student)

            present = student_atts.filter(status="present").count()
            absent  = student_atts.filter(status="absent").count()
            late    = student_atts.filter(status="late").count()

            percentage = (present / course.total_lectures) * 100 if course.total_lectures else 0

            summary.append({
                "student_id": student.id,
                "name": f"{student.user.first_name} {student.user.last_name}",
                "present": present,
                "absent": absent,
                "late": late,
                "percentage": round(percentage, 2)
            })

        return Response({
            "success": True,
            "course": course.title,
            "total_lectures": course.total_lectures,
            "students": summary
        })

class StaffCreateView(APIView):
    permission_classes = [IsInstitution, IsVerified, IsSubscribed]

    def post(self, request):
        serializer = StaffCreateSerializer(
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():
            staff = serializer.save()
            return Response({
                "success": True,
                "message": "Staff member added successfully.",
                "staff_id": staff.id
            }, status=201)

        return Response({"success": False, "errors": serializer.errors}, status=400)

class StaffEditView(APIView):
    permission_classes = [IsInstitution]

    def put(self, request, staff_id):
        try:
            staff = Staff.objects.get(id=staff_id, institution=request.user.institution)
        except Staff.DoesNotExist:
            return Response({"success": False, "message": "Staff not found."}, status=404)

        serializer = StaffEditSerializer(staff, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "Staff updated successfully."})

        return Response({"success": False, "errors": serializer.errors}, status=400)

class StaffDeleteView(APIView):
    permission_classes = [IsInstitution]

    def delete(self, request, staff_id):
        try:
            staff = Staff.objects.get(id=staff_id, institution=request.user.institution)
        except Staff.DoesNotExist:
            return Response({"success": False, "message": "Staff not found."}, status=404)

        staff.delete()
        return Response({"success": True, "message": "Staff deleted successfully."})

class StaffDetailView(APIView):
    permission_classes = [IsInstitution]

    def get(self, request, staff_id):
        try:
            staff = Staff.objects.get(id=staff_id, institution=request.user.institution)
        except Staff.DoesNotExist:
            return Response({"success": False, "message": "Staff not found."}, status=404)

        serializer = StaffDetailSerializer(staff)
        return Response({"success": True, "data": serializer.data})

class LecturerCoursesListView(ListAPIView):
    serializer_class = LecturerCourseListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        try:
            user = User.objects.get(username=self.kwargs["username"], user_type="lecturer")
        except User.DoesNotExist:
            return Course.objects.none()

        lecturer = user.lecturer
        return Course.objects.filter(lecturer=lecturer).order_by("-id")

class LecturerSelfProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != "lecturer":
            return Response({"success": False, "message": "Not a lecturer account"}, status=403)

        serializer = LecturerSelfProfileSerializer(request.user.lecturer)
        return Response({"success": True, "data": serializer.data})

class LecturerPublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username, user_type="lecturer")
        except User.DoesNotExist:
            return Response({"success": False, "message": "Lecturer not found"}, status=404)

        serializer = LecturerPublicProfileSerializer(user.lecturer)
        return Response({"success": True, "data": serializer.data})

class LecturerEditProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        if request.user.user_type != "lecturer":
            return Response({
                "success": False,
                "message": "Not a lecturer account."
            }, status=403)

        serializer = LecturerEditProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Lecturer profile updated successfully."
            })

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=400)

class LecturerApplyJobView(APIView):
    permission_classes = [IsLecturer, IsVerified]

    def post(self, request, job_id):
        lecturer = request.user.lecturer

        try:
            job = JobPost.objects.get(id=job_id)
        except JobPost.DoesNotExist:
            return Response({"success": False, "message": "Job not found."}, status=404)

        if timezone.now() - job.created_at > timedelta(days=7):
            return Response({
                "success": False,
                "message": "This job post is no longer accepting applications."
            }, status=400)

        if JobApplication.objects.filter(job=job, lecturer=lecturer).exists():
            return Response({"success": False, "message": "You already applied for this job."}, status=400)

        serializer = JobApplicationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(job=job, lecturer=lecturer)
            return Response({"success": True, "message": "Application submitted successfully."})

        return Response({"success": False, "errors": serializer.errors}, status=400)

class LecturerCreateExamView(APIView):
    permission_classes = [IsLecturer, IsVerified]

    def post(self, request, course_id):
        lecturer = request.user.lecturer

        try:
            course = Course.objects.get(id=course_id, lecturer=lecturer)
        except Course.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)

        serializer = ExamSerializer(data=request.data)
        if serializer.is_valid():
            exam = serializer.save(course=course)
            return Response({
                "success": True,
                "message": "Exam created successfully.",
                "exam_id": exam.id
            }, status=201)

        return Response({"success": False, "errors": serializer.errors}, status=400)

class LecturerAddGradesView(APIView):
    permission_classes = [IsLecturer, IsVerified]

    def post(self, request, exam_id):
        lecturer = request.user.lecturer

        try:
            exam = Exam.objects.select_related("course").get(id=exam_id, course__lecturer=lecturer)
        except Exam.DoesNotExist:
            return Response({"success": False, "message": "Exam not found."}, status=404)

        serializer = GradeBulkCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=400)

        grades_data = serializer.validated_data["grades"]
        course = exam.course
        max_score = exam.max_score

        for item in grades_data:
            student_id = item["student_id"]
            score = item["score"]

            if score < 0 or score > max_score:
                continue

            try:
                student = Student.objects.get(id=student_id, courses=course)
            except Student.DoesNotExist:
                continue

            grade, _ = Grade.objects.update_or_create(
                exam=exam,
                student=student,
                defaults={"score": score}
            )

            user = student.user
            subject = f"Grade for {exam.title} - {course.title}"
            msg = (
                f"Dear {user.first_name},\n\n"
                f"Your score for exam '{exam.title}' in course '{course.title}' is {score}/{max_score}.\n\n"
                f"Best regards."
            )

            recipients = [user.email]
            if student.responsible_email:
                recipients.append(student.responsible_email)

            send_mail(
                subject=subject,
                message=msg,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=recipients,
                fail_silently=True,
            )

        return Response({"success": True, "message": "Grades processed and emails sent."})

class LecturerMarkAttendanceView(APIView):
    permission_classes = [IsLecturer, IsVerified]

    def post(self, request, course_id):
        lecturer = request.user.lecturer

        try:
            course = Course.objects.get(id=course_id, lecturer=lecturer)
        except Course.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)

        serializer = AttendanceCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=400)

        lecture_number = serializer.validated_data["lecture_number"]
        records = serializer.validated_data["records"]

        if lecture_number < 1 or lecture_number > course.total_lectures:
            return Response({
                "success": False,
                "message": "Invalid lecture number."
            }, status=400)

        for rec in records:
            student_id = rec["student_id"]
            status_val = rec["status"]

            try:
                student = Student.objects.get(id=student_id, courses=course)
            except Student.DoesNotExist:
                continue

            Attendance.objects.update_or_create(
                course=course,
                student=student,
                lecture_number=lecture_number,
                defaults={"status": status_val}
            )

        return Response({"success": True, "message": "Attendance saved successfully."})

class LecturerViewLectureAttendanceView(APIView):
    permission_classes = [IsLecturer, IsVerified]

    def get(self, request, course_id, lecture_number):
        lecturer = request.user.lecturer

        try:
            course = Course.objects.get(id=course_id, lecturer=lecturer)
        except Course.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)

        if lecture_number < 1 or lecture_number > course.total_lectures:
            return Response({"success": False, "message": "Invalid lecture number."}, status=400)

        attendances = Attendance.objects.filter(course=course, lecture_number=lecture_number)

        data = [
            {
                "student_id": att.student.id,
                "name": f"{att.student.user.first_name} {att.student.user.last_name}",
                "status": att.status
            }
            for att in attendances
        ]

        return Response({
            "success": True,
            "course": course.title,
            "lecture_number": lecture_number,
            "records": data
        })

class LecturerWeeklyScheduleView(APIView):
    permission_classes = [IsLecturer, IsVerified]

    def get(self, request):
        lecturer = request.user.lecturer
        courses = lecturer.courses.select_related("institution")

        schedule = []

        for course in courses:
            for day in course.days:
                schedule.append({
                    "course_id": course.id,
                    "course_title": course.title,
                    "day": day,
                    "start_time": course.start_time.strftime("%H:%M"),
                    "end_time": course.end_time.strftime("%H:%M"),
                    "institution": course.institution.title,
                    "starting_date": course.starting_date,
                    "ending_date": course.ending_date,
                })

        # sort schedule
        day_order = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
        schedule.sort(key=lambda x: (day_order.index(x["day"]), x["start_time"]))

        return Response({
            "success": True,
            "schedule": schedule
        })

class LecturerViewGradesView(APIView):
    permission_classes = [IsLecturer, IsVerified]

    def get(self, request, exam_id):
        lecturer = request.user.lecturer

        try:
            exam = Exam.objects.select_related("course").get(
                id=exam_id,
                course__lecturer=lecturer
            )
        except Exam.DoesNotExist:
            return Response({"success": False, "message": "Exam not found."}, status=404)

        grades = Grade.objects.filter(exam=exam).select_related("student__user")

        data = LecturerGradeViewSerializer(grades, many=True).data

        return Response({
            "success": True,
            "exam_title": exam.title,
            "course": exam.course.title,
            "max_score": exam.max_score,
            "grades": data
        })

class LecturerEditGradesView(APIView):
    permission_classes = [IsLecturer, IsVerified]

    def put(self, request, exam_id):
        lecturer = request.user.lecturer

        try:
            exam = Exam.objects.select_related("course").get(
                id=exam_id,
                course__lecturer=lecturer
            )
        except Exam.DoesNotExist:
            return Response({"success": False, "message": "Exam not found."}, status=404)

        serializer = GradeBulkCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=400)

        grades_data = serializer.validated_data["grades"]
        course = exam.course
        max_score = exam.max_score

        for item in grades_data:
            student_id = item["student_id"]
            score = item["score"]

            # Validate score
            if score < 0 or score > max_score:
                continue

            try:
                student = Student.objects.get(id=student_id, courses=course)
            except Student.DoesNotExist:
                continue

            Grade.objects.update_or_create(
                exam=exam,
                student=student,
                defaults={"score": score}
            )

        return Response({
            "success": True,
            "message": "Grades updated successfully."
        })

class StudentSelfProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != "student":
            return Response({"success": False, "message": "Not a student account"}, status=403)

        serializer = StudentSelfProfileSerializer(request.user)
        return Response({"success": True, "data": serializer.data})

class StudentPublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username, user_type="student")
        except User.DoesNotExist:
            return Response({"success": False, "message": "Student not found"}, status=404)

        serializer = StudentPublicProfileSerializer(user)
        return Response({"success": True, "data": serializer.data})

class StudentCoursesListView(ListAPIView):
    serializer_class = StudentCourseListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        try:
            user = User.objects.get(username=self.kwargs["username"], user_type="student")
        except User.DoesNotExist:
            return Course.objects.none()

        student = user.student
        return student.courses.all().order_by("-id")

class StudentEditProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        if request.user.user_type != "student":
            return Response({
                "success": False,
                "message": "Not a student account."
            }, status=403)

        serializer = StudentEditProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Student profile updated successfully."
            })

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=400)

class StudentEnrollCourseView(APIView):
    permission_classes = [IsAuthenticated, IsStudent, IsVerified, CanPay]

    def post(self, request, course_id):
        user = request.user
        student = user.student

        # 1) Fetch course
        try:
            course = Course.objects.select_related("institution").get(id=course_id)
        except Course.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)

        # 2) Capacity check
        if course.capacity > 0 and course.students.count() >= course.capacity:
            return Response({"success": False, "message": "Course capacity is full."}, status=400)

        # 3) Institution must have a connected account
        institution = course.institution
        if not institution.stripe_account_id:
            return Response({
                "success": False,
                "message": "Institution cannot receive payments yet."
            }, status=400)

        # 4) Convert price → cents
        amount_cents = int(course.price * 100)

        # 5) Create Stripe Checkout Session (money to institution)
        try:
            session = stripe.checkout.Session.create(
                mode="payment",
                customer_email=user.email,
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "unit_amount": amount_cents,
                            "product_data": {
                                "name": course.title,
                            },
                        },
                        "quantity": 1,
                    }
                ],
                payment_intent_data={
                    "transfer_data": {
                        "destination": institution.stripe_account_id,
                    },
                },
                success_url=f"{settings.FRONTEND_DOMAIN}/payment/course-success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_DOMAIN}/payment/course-cancel",
            )

        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=400)

        # 6) Save payment record
        CoursePayment.objects.create(
            student=student,
            course=course,
            stripe_payment_intent=session.payment_intent,
            amount=amount_cents,
            paid=False,
        )

        # 7) Return checkout URL
        return Response({
            "success": True,
            "checkout_url": session.url
        })
class StudentViewAttendanceView(APIView):
    permission_classes = [IsStudent, IsVerified]

    def get(self, request, course_id):
        student = request.user.student

        try:
            course = Course.objects.get(id=course_id, students=student)
        except Course.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)

        records = Attendance.objects.filter(course=course, student=student).order_by("lecture_number")

        data = [
            {
                "lecture_number": rec.lecture_number,
                "status": rec.status
            }
            for rec in records
        ]

        total = course.total_lectures
        present = records.filter(status="present").count()

        percentage = round((present / total) * 100, 2) if total > 0 else 0

        return Response({
            "success": True,
            "course": course.title,
            "total_lectures": total,
            "attendance_percentage": percentage,
            "records": data
        })

class StudentViewGradesView(APIView):
    permission_classes = [IsStudent, IsVerified]

    def get(self, request, course_id):
        student = request.user.student

        try:
            course = Course.objects.get(id=course_id, students=student)
        except Course.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)

        grades = Grade.objects.filter(
            exam__course=course,
            student=student
        ).select_related("exam")

        data = StudentGradeSerializer(grades, many=True).data

        return Response({
            "success": True,
            "course": course.title,
            "grades": data
        })

class StudentWeeklyScheduleView(APIView):
    permission_classes = [IsStudent, IsVerified]

    def get(self, request):
        student = request.user.student
        courses = student.courses.select_related("lecturer__user", "institution")

        schedule = []

        for course in courses:
            for day in course.days:
                schedule.append({
                    "course_id": course.id,
                    "course_title": course.title,
                    "day": day,
                    "start_time": course.start_time.strftime("%H:%M"),
                    "end_time": course.end_time.strftime("%H:%M"),
                    "lecturer": f"{course.lecturer.user.first_name} {course.lecturer.user.last_name}",
                    "institution": course.institution.title,
                    "starting_date": course.starting_date,
                    "ending_date": course.ending_date,
                })

        # sort by day order & time
        day_order = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
        schedule.sort(key=lambda x: (day_order.index(x["day"]), x["start_time"]))

        return Response({
            "success": True,
            "schedule": schedule
        })

class CourseProgressView(APIView):
    permission_classes = [AllowAny]  # anyone can access

    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)

        total_lectures = course.total_lectures

        # If total lectures = 0 → progress is 0
        if total_lectures == 0:
            return Response({
                "success": True,
                "progress": {
                    "course_title": course.title,
                    "total_lectures": 0,
                    "completed_lectures": 0,
                    "progress_percentage": 0
                }
            })

        user = request.user if request.user.is_authenticated else None

        # STUDENT personal progress
        if user and user.user_type == "student" and hasattr(user, "student"):
            student = user.student

            # must be enrolled
            if not student.courses.filter(id=course.id).exists():
                return Response({"success": False, "message": "You are not enrolled in this course."}, status=403)

            present = Attendance.objects.filter(
                course=course,
                student=student,
                status="present"
            ).count()

            percentage = round((present / total_lectures) * 100, 2)

            return Response({
                "success": True,
                "progress": {
                    "course_title": course.title,
                    "total_lectures": total_lectures,
                    "completed_lectures": present,
                    "progress_percentage": percentage
                }
            })

        # LECTURER / INSTITUTION / VISITOR → OVERALL AVERAGE PROGRESS
        students = Student.objects.filter(courses=course)

        if not students.exists():
            return Response({
                "success": True,
                "progress": {
                    "course_title": course.title,
                    "total_lectures": total_lectures,
                    "completed_lectures": 0,
                    "progress_percentage": 0
                }
            })

        total_present = 0

        for st in students:
            total_present += Attendance.objects.filter(
                course=course,
                student=st,
                status="present"
            ).count()

        # average = total present / (#students × total lectures)
        avg_percentage = round(
            (total_present / (students.count() * total_lectures)) * 100,
            2
        )

        return Response({
            "success": True,
            "progress": {
                "course_title": course.title,
                "total_lectures": total_lectures,
                "completed_lectures": None,  # not personal
                "progress_percentage": avg_percentage
            }
        })

class NotificationsView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        user = request.user

        tomorrow = timezone.now().date() + timedelta(days=1)
        tomorrow_day = tomorrow.strftime("%A").lower()

        notifications = []

        if user.user_type == "student":
            student = user.student
            courses = student.courses.all()

            for course in courses:
                if tomorrow_day in course.days:
                    notifications.append({
                        "type": "lecture_reminder",
                        "course_title": course.title,
                        "message": f"You have '{course.title}' tomorrow at {course.start_time.strftime('%H:%M')}.",
                        "day": tomorrow_day,
                        "time": course.start_time.strftime("%H:%M")
                    })

   
        elif user.user_type == "lecturer":
            lecturer = user.lecturer
            courses = lecturer.courses.all()

            for course in courses:
                if tomorrow_day in course.days:
                    notifications.append({
                        "type": "lecture_reminder",
                        "course_title": course.title,
                        "message": f"You are teaching '{course.title}' tomorrow at {course.start_time.strftime('%H:%M')}.",
                        "day": tomorrow_day,
                        "time": course.start_time.strftime("%H:%M")
                    })

        return Response({
            "success": True,
            "notifications": notifications
        })

class ExploreSearchView(APIView):
    permission_classes = [AllowAny]  # public search

    def get(self, request):
        q = request.query_params.get("q", "").strip().lower()
        filter_type = request.query_params.get("filter", "").lower()

        # Get user city (if logged in)
        user_city = None
        if request.user.is_authenticated:
            user_city = request.user.city.lower()

        # Helper: prioritize results by city
        def prioritize_city(queryset, city_field):
            if not user_city:
                return queryset  # no prioritization
            return sorted(
                queryset,
                key=lambda item: 0 if city_field(item).lower() == user_city else 1
            )

        # -------------------------
        # FETCHERS FOR EACH MODEL
        # -------------------------

        # STUDENTS
        def fetch_students():
            qs = Student.objects.filter(
                Q(user__first_name__icontains=q) |
                Q(user__last_name__icontains=q) |
                Q(interesting_keywords__icontains=q)
            ).select_related("user")
            return prioritize_city(qs, lambda x: x.user.city)

        # LECTURERS
        def fetch_lecturers():
            qs = Lecturer.objects.filter(
                Q(user__first_name__icontains=q) |
                Q(user__last_name__icontains=q) |
                Q(specialty__icontains=q) |
                Q(skills__icontains=q)
            ).select_related("user")
            return prioritize_city(qs, lambda x: x.user.city)

        # INSTITUTIONS
        def fetch_institutions():
            qs = Institution.objects.filter(
                Q(title__icontains=q) |
                Q(location__icontains=q) |
                Q(user__city__icontains=q)
            ).select_related("user")
            return prioritize_city(qs, lambda x: x.user.city)

        # COURSES
        def fetch_courses():
            qs = Course.objects.filter(
                Q(title__icontains=q) |
                Q(about__icontains=q)
            ).select_related("institution__user")
            return prioritize_city(qs, lambda x: x.institution.user.city)

        # JOBS
        def fetch_jobs():
            qs = JobPost.objects.filter(
                Q(title__icontains=q) |
                Q(description__icontains=q) |
                Q(skills_required__icontains=q) |
                Q(experience_required__icontains=q) |
                Q(specialty__icontains=q)
            ).select_related("institution__user")
            return prioritize_city(qs, lambda x: x.institution.user.city)


        # -------------------------------
        # APPLY FILTER (if provided)
        # -------------------------------
        if filter_type:
            if filter_type == "students":
                return Response({
                    "success": True,
                    "students": SearchStudentSerializer(fetch_students(), many=True).data
                })

            if filter_type == "lecturers":
                return Response({
                    "success": True,
                    "lecturers": SearchLecturerSerializer(fetch_lecturers(), many=True).data
                })

            if filter_type == "institutions":
                return Response({
                    "success": True,
                    "institutions": SearchInstitutionSerializer(fetch_institutions(), many=True).data
                })

            if filter_type == "courses":
                return Response({
                    "success": True,
                    "courses": SearchCourseSerializer(fetch_courses(), many=True).data
                })

            if filter_type == "jobs":
                return Response({
                    "success": True,
                    "jobs": SearchJobSerializer(fetch_jobs(), many=True).data
                })

            return Response({"success": False, "message": "Invalid filter."}, status=400)

        # -------------------------------
        # NO FILTER → RETURN GROUPED
        # -------------------------------
        return Response({
            "success": True,
            "results": {
                "students": SearchStudentSerializer(fetch_students(), many=True).data,
                "lecturers": SearchLecturerSerializer(fetch_lecturers(), many=True).data,
                "institutions": SearchInstitutionSerializer(fetch_institutions(), many=True).data,
                "courses": SearchCourseSerializer(fetch_courses(), many=True).data,
                "jobs": SearchJobSerializer(fetch_jobs(), many=True).data,
            }
        })

class StudentVerificationView(APIView):
    permission_classes = [IsStudent]

    def put(self, request):
        user = request.user
        serializer = StudentVerificationSerializer(
            user,
            data=request.data,
            partial=False
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Student account verified successfully.",
                "is_verified": True
            })

        return Response({"success": False, "errors": serializer.errors}, status=400)

class LecturerVerificationView(APIView):
    permission_classes = [IsLecturer]

    def put(self, request):
        user = request.user
        serializer = LecturerVerificationSerializer(
            user,
            data=request.data,
            partial=False
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Lecturer account verified successfully.",
                "is_verified": True
            })

        return Response({"success": False, "errors": serializer.errors}, status=400)

def find_conflict(existing_courses, days, start_time, end_time):
    for course in existing_courses:
        for day in course.days:
            if day in days:
                if not (end_time <= course.start_time or start_time >= course.end_time):
                    return {
                        "course_id": course.id,
                        "course_title": course.title,
                        "institution": course.institution.title,
                        "institution_username": course.institution.user.username,
                        "day": day,
                        "time": f"{course.start_time.strftime('%H:%M')} - {course.end_time.strftime('%H:%M')}"
                    }
    return None

class StudentScheduleCheckView(APIView):
    permission_classes = [IsVerified, IsStudent]

    def post(self, request, course_id):
        user = request.user

        try:
            new_course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)

        student = user.student
        existing_courses = student.courses.all()

        conflict = find_conflict(
            existing_courses,
            new_course.days,
            new_course.start_time,
            new_course.end_time
        )

        if conflict:
            return Response({"success": False, "contradiction": conflict})

        return Response({"success": True, "contradiction": None})

class LecturerScheduleCheckView(APIView):
    permission_classes = [IsVerified & IsInstitution]

    def post(self, request, lecturer_id):
        try:
            lecturer = Lecturer.objects.get(id=lecturer_id)
        except Lecturer.DoesNotExist:
            return Response({"success": False, "message": "Lecturer not found."}, status=404)

        days = request.data.get("days", [])
        start_time = request.data.get("start_time")
        end_time = request.data.get("end_time")

        if not days or not start_time or not end_time:
            return Response({"success": False, "message": "days, start_time, end_time required."}, status=400)

        # Convert times
        from datetime import time
        h1, m1 = map(int, start_time.split(":"))
        h2, m2 = map(int, end_time.split(":"))
        start_time = time(h1, m1)
        end_time = time(h2, m2)

        existing_courses = lecturer.courses.all()

        conflict = find_conflict(existing_courses, days, start_time, end_time)

        if conflict:
            return Response({"success": False, "contradiction": conflict})

        return Response({"success": True, "contradiction": None})

class ExpectedStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsLecturer | IsInstitution]

    def get(self, request, course_id, lecture_number):
        user = request.user

        # Fetch course safely
        try:
            course = Course.objects.select_related("institution", "lecturer__user").get(id=course_id)
        except Course.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)

        # PERMISSION CHECKS
        if user.user_type == "lecturer":
            if course.lecturer != user.lecturer:
                return Response({"success": False, "message": "Not allowed."}, status=403)

        if user.user_type == "institution":
            if course.institution != user.institution:
                return Response({"success": False, "message": "Not allowed."}, status=403)

        if user.user_type == "student":
            return Response({"success": False, "message": "Students cannot access this."}, status=403)

        # Validate lecture number
        if lecture_number < 1 or lecture_number > course.total_lectures:
            return Response({"success": False, "message": "Invalid lecture number."}, status=400)

        # Fetch enrolled students
        enrolled_students = course.students.select_related("user").all()

        students_list = []
        for st in enrolled_students:
            students_list.append({
                "student_id": st.id,
                "username": st.user.username,
                "name": f"{st.user.first_name} {st.user.last_name}",
                "profile_image": (
                    st.user.profile_image.url if st.user.profile_image else None
                )
            })

        return Response({
            "success": True,
            "course": course.title,
            "lecture_number": lecture_number,
            "students": students_list,
        })

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateInstitutionSubscriptionCheckout(APIView):
    permission_classes = [IsAuthenticated, IsInstitution, IsVerified]

    def post(self, request):
        user = request.user

        plan = request.data.get("plan")  # "3m", "6m", "12m"

        price_map = {
            "3m": settings.STRIPE_PRICE_3_MONTHS,
            "6m": settings.STRIPE_PRICE_6_MONTHS,
            "12m": settings.STRIPE_PRICE_12_MONTHS,
        }

        print(price_map)

        price_id = price_map.get(plan)
        if not price_id:
            return Response({"success": False, "message": "Invalid plan."}, status=400)

        success_url = f"{settings.FRONTEND_DOMAIN}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{settings.FRONTEND_DOMAIN}/payment/cancel"

        try:
            checkout_session = stripe.checkout.Session.create(
                mode="subscription",
                customer_email=user.email,
                line_items=[{"price": price_id, "quantity": 1}],
                success_url=success_url,
                cancel_url=cancel_url,
            )

            return Response({
                "success": True,
                "checkout_url": checkout_session.url
            })
        
        except Exception as e:
            import traceback
            error_text = traceback.format_exc()

            return Response({
                "success": False,
                "error": error_text
            }, status=400)

class InstitutionSetupPaymentsView(APIView):
    permission_classes = [IsAuthenticated, IsInstitution]

    def post(self, request):
        user = request.user
        institution = user.institution

        # Create account if missing
        if not institution.stripe_account_id:
            acct = stripe.Account.create(type="standard")
            institution.stripe_account_id = acct.id
            institution.save()

        onboarding_link = stripe.AccountLink.create(
            account=institution.stripe_account_id,
            refresh_url=f"{settings.FRONTEND_DOMAIN}/payments/refresh",
            return_url=f"{settings.FRONTEND_DOMAIN}/payments/complete",
            type="account_onboarding",
        )

        return Response({
            "success": True,
            "onboarding_url": onboarding_link.url
        })

class StudentSetupPaymentMethodView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request):
        user = request.user

        if user.user_type != "student":
            return Response({"success": False, "message": "Only students."}, status=403)

        student = user.student

        # Create customer if needed
        if not student.stripe_customer_id:
            customer = stripe.Customer.create(email=user.email, name=user.username)
            student.stripe_customer_id = customer.id
            student.save()

        # Billing Portal → manage/add cards
        session = stripe.billing_portal.Session.create(
            customer=student.stripe_customer_id,
            return_url=f"{settings.FRONTEND_DOMAIN}/payments/complete"
        )

        return Response({
            "success": True,
            "portal_url": session.url
        })


