from rest_framework import serializers
from .models import *
from django.utils import timezone
from datetime import timedelta
import datetime

class FeedItemSerializer(serializers.Serializer):
    type = serializers.CharField()
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    image = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField(allow_null=True)
    publisher_id = serializers.IntegerField(allow_null=True)
    publisher_username = serializers.CharField(allow_null=True)
    publisher_profile_image = serializers.CharField(allow_null=True)

class SignupSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'city', 'user_type']

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

class InstitutionVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'title',
            'location',
            'phone_number',
            'about',
            'profile_image',
            'idcard_back',
            'idcard_front',
            'residence_front',
            'residence_back',
        ]

    title = serializers.CharField(required=True)
    location = serializers.CharField(required=True)

    def validate(self, data):
        required = [
            'phone_number',
            'about',
            'profile_image',
            'idcard_back',
            'idcard_front',
            'residence_front',
            'residence_back',
        ]

        for field in required:
            if field not in data or not data[field]:
                raise serializers.ValidationError({field: "This field is required."})

        return data

    def update(self, instance, validated_data):
        institution = instance.institution
        institution.title = validated_data.pop('title')
        institution.location = validated_data.pop('location')
        institution.save()

        for key, value in validated_data.items():
            setattr(instance, key, value)

        instance.is_verified = True
        instance.save()

        return instance

class InstitutionEditProfileSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=True)
    location = serializers.CharField(required=True)
    username = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'phone_number',
            'about',
            'profile_image',
            'idcard_back',
            'idcard_front',
            'residence_front',
            'residence_back',
            'title',
            'location',
        ]

    def validate_username(self, value):
        user = self.instance
        if value != user.username and User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def update(self, instance, validated_data):
        inst = instance.institution
        inst.title = validated_data.pop('title', inst.title)
        inst.location = validated_data.pop('location', inst.location)
        inst.save()

        for key, val in validated_data.items():
            setattr(instance, key, val)

        instance.save()
        return instance

class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ['image']

class PostCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False
    )

    class Meta:
        model = Post
        fields = ['title', 'description', 'images']

    def create(self, validated_data):
        images = validated_data.pop('images', [])
        post = Post.objects.create(**validated_data)

        for img in images:
            PostImage.objects.create(post=post, image=img)

        return post

def count_lectures(start_date, end_date, days_list):
    day_map = {
        "monday": 0,
        "tuesday": 1,
        "wednesday": 2,
        "thursday": 3,
        "friday": 4,
        "saturday": 5,
        "sunday": 6,
    }

    target_days = [day_map[d] for d in days_list]
    count = 0

    cur = start_date
    while cur <= end_date:
        if cur.weekday() in target_days:
            count += 1
        cur += datetime.timedelta(days=1)

    return count

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'about',
            'course_image',
            'starting_date',
            'ending_date',
            'level',
            'price',
            'days',
            'start_time',
            'end_time',
            'lecturer',
            'capacity',
        ]
        extra_kwargs = {
            "capacity": {"required": True},
            "price": {"required": True},
        }

    def validate(self, data):
        capacity = data.get("capacity")
        price = data.get("price")

        start = data.get("starting_date") or getattr(self.instance, "starting_date", None)
        end   = data.get("ending_date") or getattr(self.instance, "ending_date", None)

        if start and end and end < start:
            raise serializers.ValidationError({
                "ending_date": "Ending date cannot be before starting date."
            })

        if price < 0:
            raise serializers.ValidationError({"price": "Price must be a positive number."})

        if capacity < 0:
            raise serializers.ValidationError({"capacity": "Capacity must be a positive integer."})

        st = data.get("start_time") or getattr(self.instance, "start_time", None)
        et = data.get("end_time") or getattr(self.instance, "end_time", None)

        if st and et and et <= st:
            raise serializers.ValidationError({
                "end_time": "End time must be greater than start time."
            })

        return data

    def create(self, validated_data):
        institution = self.context["request"].user.institution

        start = validated_data["starting_date"]
        end   = validated_data["ending_date"]
        days  = validated_data["days"]

        validated_data["total_lectures"] = count_lectures(start, end, days)

        return Course.objects.create(institution=institution, **validated_data)

    def update(self, instance, validated_data):
        start = validated_data.get("starting_date", instance.starting_date)
        end   = validated_data.get("ending_date", instance.ending_date)
        days  = validated_data.get("days", instance.days)

        validated_data["total_lectures"] = count_lectures(start, end, days)

        return super().update(instance, validated_data)

class InstitutionSelfProfileSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="institution.title")
    location = serializers.CharField(source="institution.location")

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "city",
            "phone_number",
            "about",
            "profile_image",
            "idcard_back",
            "idcard_front",
            "residence_front",
            "residence_back",
            "is_verified",

            "title",
            "location",
        ]

class InstitutionPublicProfileSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="institution.title")
    location = serializers.CharField(source="institution.location")

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "city",
            "about",
            "profile_image",
            "title",
            "location",
            "is_verified",
        ]

class InstitutionCourseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "about",
            "course_image",
            "starting_date",
            "ending_date",
            "level",
            "price",
        ]

class InstitutionPostListSerializer(serializers.ModelSerializer):
    images = PostImageSerializer(many=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "description",
            "created_at",
            "images",
        ]

class LecturerSimpleSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    full_name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = Lecturer
        fields = ["id", "username", "full_name", "profile_image"]

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_profile_image(self, obj):
        return obj.user.profile_image.url if obj.user.profile_image else None


class InstitutionViewStudentSerializer(serializers.ModelSerializer):
    studying_level = serializers.CharField(source="student.studying_level")
    interesting_keywords = serializers.CharField(source="student.interesting_keywords")
    responsible_phone = serializers.CharField(source="student.responsible_phone")
    responsible_email = serializers.EmailField(source="student.responsible_email")

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "city",
            "phone_number",
            "about",
            "profile_image",
            "idcard_back",
            "idcard_front",
            "residence_front",
            "residence_back",
            "is_verified",

            # student specific
            "studying_level",
            "interesting_keywords",
            "responsible_phone",
            "responsible_email",
        ]

class InstitutionViewLecturerSerializer(serializers.ModelSerializer):
    academic_achievement = serializers.CharField(source="lecturer.academic_achievement")
    specialty = serializers.CharField(source="lecturer.specialty")
    skills = serializers.CharField(source="lecturer.skills")
    experience = serializers.IntegerField(source="lecturer.experience")
    free_time = serializers.CharField(source="lecturer.free_time")

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "city",
            "phone_number",
            "about",
            "profile_image",
            "idcard_back",
            "idcard_front",
            "residence_front",
            "residence_back",
            "is_verified",


            # lecturer fields
            "academic_achievement",
            "specialty",
            "skills",
            "experience",
            "free_time",
        ]

class CourseDetailSerializer(serializers.ModelSerializer):
    lecturer_name = serializers.SerializerMethodField()
    institution_name = serializers.CharField(source="institution.title")
    institution_username = serializers.CharField(source="institution.user.username")

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "about",
            "course_image",
            "starting_date",
            "ending_date",
            "level",
            "price",
            "days",
            "start_time",
            "end_time",

            "lecturer",
            "lecturer_name",
            "institution_name",
            "institution_username",
        ]

    def get_lecturer_name(self, obj):
        u = obj.lecturer.user
        return f"{u.first_name} {u.last_name}"

class JobPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPost
        fields = [
            "id",
            "title",
            "description",
            "specialty",
            "experience_required",
            "skills_required",
            "salary_offer",
            "created_at"
        ]

    def create(self, validated_data):
        institution = self.context["request"].user.institution
        return JobPost.objects.create(institution=institution, **validated_data)

class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ["id", "message", "created_at"]

class StaffCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = [
            "first_name",
            "last_name",
            "phone_number",
            "personal_image",
            "idcard_front",
            "idcard_back",
            "residence_front",
            "residence_back",
            "duty",
            "salary",
        ]

    def create(self, validated_data):
        institution = self.context["request"].user.institution
        return Staff.objects.create(institution=institution, **validated_data)

class StaffEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = [
            "first_name",
            "last_name",
            "phone_number",
            "personal_image",
            "idcard_front",
            "idcard_back",
            "residence_front",
            "residence_back",
            "duty",
            "salary",
        ]

class StaffDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = [
            "id",
            "first_name",
            "last_name",
            "phone_number",
            "personal_image",
            "idcard_front",
            "idcard_back",
            "residence_front",
            "residence_back",
            "duty",
            "salary",
            "is_active",
        ]

class LecturerSelfProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email")
    city = serializers.CharField(source="user.city")
    phone_number = serializers.CharField(source="user.phone_number")
    about = serializers.CharField(source="user.about")
    profile_image = serializers.ImageField(source="user.profile_image")
    is_verified = serializers.BooleanField(source="user.is_verified")

    idcard_back = serializers.ImageField(source="user.idcard_back")
    idcard_front = serializers.ImageField(source="user.idcard_front")
    residence_front = serializers.ImageField(source="user.residence_front")
    residence_back = serializers.ImageField(source="user.residence_back")

    institutions = serializers.StringRelatedField(many=True)

    class Meta:
        model = Lecturer
        fields = [
            "id",

            "first_name",
            "last_name",
            "email",
            "city",
            "phone_number",
            "about",
            "profile_image",
            "idcard_back",
            "idcard_front",
            "residence_front",
            "residence_back",
            "is_verified",


            "academic_achievement",
            "specialty",
            "skills",
            "experience",
            "free_time",
            "institutions",
        ]

class LecturerPublicProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    city = serializers.CharField(source="user.city")
    profile_image = serializers.ImageField(source="user.profile_image")
    is_verified = serializers.BooleanField(source="user.is_verified")

    institutions = serializers.StringRelatedField(many=True)

    class Meta:
        model = Lecturer
        fields = [
            "id",
            "first_name",
            "last_name",
            "city",
            "profile_image",
            "specialty",
            "experience",
            "academic_achievement",
            "institutions",
            "free_time",
            "is_verified",
        ]

class LecturerCourseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "about",
            "course_image",
            "starting_date",
            "ending_date",
            "level",
            "price",
        ]

class LecturerEditProfileSerializer(serializers.ModelSerializer):
    academic_achievement = serializers.CharField(source="lecturer.academic_achievement", required=False)
    specialty = serializers.CharField(source="lecturer.specialty", required=False)
    skills = serializers.CharField(source="lecturer.skills", required=False)
    experience = serializers.IntegerField(source="lecturer.experience", required=False)
    free_time = serializers.CharField(source="lecturer.free_time", required=False)

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "city",
            "phone_number",
            "about",
            "profile_image",
            "idcard_back",
            "idcard_front",
            "residence_front",
            "residence_back",

            "academic_achievement",
            "specialty",
            "skills",
            "experience",
            "free_time",
        ]

    def update(self, instance, validated_data):
        lecturer_data = validated_data.pop("lecturer", {})
        lecturer = instance.lecturer

        for k, v in lecturer_data.items():
            setattr(lecturer, k, v)
        lecturer.save()

        for k, v in validated_data.items():
            setattr(instance, k, v)

        instance.save()
        return instance

class LecturerGradeViewSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source="student.id")
    student_name = serializers.CharField(source="student.user.get_full_name")
    score = serializers.FloatField()
    max_score = serializers.IntegerField(source="exam.max_score")

    class Meta:
        model = Grade
        fields = ["student_id", "student_name", "score", "max_score"]

class StudentSelfProfileSerializer(serializers.ModelSerializer):
    studying_level = serializers.CharField(source="student.studying_level")
    interesting_keywords = serializers.CharField(source="student.interesting_keywords")
    responsible_phone = serializers.CharField(source="student.responsible_phone")
    responsible_email = serializers.EmailField(source="student.responsible_email")

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "city",
            "phone_number",
            "about",
            "profile_image",
            "idcard_back",
            "idcard_front",
            "residence_front",
            "residence_back",
            "is_verified",

            "studying_level",
            "interesting_keywords",
            "responsible_phone",
            "responsible_email",
        ]

class StudentPublicProfileSerializer(serializers.ModelSerializer):
    studying_level = serializers.CharField(source="student.studying_level")

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "city",
            "about",
            "profile_image",
            "studying_level",
            "is_verified",
        ]

class StudentCourseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "about",
            "course_image",
            "starting_date",
            "ending_date",
            "level",
            "price",
        ]

class StudentEditProfileSerializer(serializers.ModelSerializer):
    studying_level = serializers.CharField(source="student.studying_level", required=False)
    interesting_keywords = serializers.CharField(source="student.interesting_keywords", required=False)
    responsible_phone = serializers.CharField(source="student.responsible_phone", required=False)
    responsible_email = serializers.EmailField(source="student.responsible_email", required=False)

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "city",
            "phone_number",
            "about",
            "profile_image",
            "idcard_back",
            "idcard_front",
            "residence_front",
            "residence_back",

            "studying_level",
            "interesting_keywords",
            "responsible_phone",
            "responsible_email",
        ]

    def update(self, instance, validated_data):
        student_data = validated_data.pop("student", {})
        student = instance.student

        for k, v in student_data.items():
            setattr(student, k, v)
        student.save()

        for k, v in validated_data.items():
            setattr(instance, k, v)

        instance.save()
        return instance

class ExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = ["id", "title", "date", "max_score"]

class GradeCreateSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    score = serializers.FloatField()

class GradeBulkCreateSerializer(serializers.Serializer):
    grades = GradeCreateSerializer(many=True)

class AttendanceRecordSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=["present", "absent", "late"])

class AttendanceCreateSerializer(serializers.Serializer):
    lecture_number = serializers.IntegerField()
    records = AttendanceRecordSerializer(many=True)

class StudentGradeSerializer(serializers.ModelSerializer):
    score = serializers.FloatField()
    exam_title = serializers.CharField(source="exam.title")
    exam_date = serializers.DateField(source="exam.date")
    max_score = serializers.IntegerField(source="exam.max_score")

    class Meta:
        model = Grade
        fields = ["exam_title", "exam_date", "score", "max_score"]

class WeeklyScheduleItemSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    course_title = serializers.CharField()
    day = serializers.CharField()
    start_time = serializers.CharField()
    end_time = serializers.CharField()
    lecturer = serializers.CharField(required=False)
    institution = serializers.CharField(required=False)

class CourseProgressSerializer(serializers.Serializer):
    course_title = serializers.CharField()
    total_lectures = serializers.IntegerField()
    completed_lectures = serializers.IntegerField()
    progress_percentage = serializers.FloatField()

class SearchStudentSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    city = serializers.CharField(source="user.city")
    username = serializers.CharField(source="user.username")
    profile_image = serializers.SerializerMethodField()
    studying_level = serializers.CharField()

    class Meta:
        model = Student
        fields = [
            "id", 
            "name", 
            "city",
            "username",
            "profile_image",
            "studying_level",
        ]

    def get_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_profile_image(self, obj):
        return obj.user.profile_image.url if obj.user.profile_image else None

class SearchLecturerSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    city = serializers.CharField(source="user.city")
    username = serializers.CharField(source="user.username")
    profile_image = serializers.SerializerMethodField()
    institutions = serializers.SerializerMethodField()  # list of institution titles

    class Meta:
        model = Lecturer
        fields = [
            "id",
            "name",
            "city",
            "specialty",
            "username",
            "profile_image",
            "institutions",
        ]

    def get_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_profile_image(self, obj):
        return obj.user.profile_image.url if obj.user.profile_image else None

    def get_institutions(self, obj):
        return [inst.title for inst in obj.institutions.all()]

class SearchInstitutionSerializer(serializers.ModelSerializer):
    title = serializers.CharField()
    city = serializers.CharField(source="user.city")
    username = serializers.CharField(source="user.username")
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = Institution
        fields = [
            "id",
            "title",
            "location",
            "city",
            "username",
            "profile_image",
        ]

    def get_profile_image(self, obj):
        return obj.user.profile_image.url if obj.user.profile_image else None

class SearchCourseSerializer(serializers.ModelSerializer):
    institution = serializers.CharField(source="institution.title")
    city = serializers.CharField(source="institution.user.city")
    publisher_username = serializers.CharField(source="institution.user.username")
    publisher_profile_image = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "about",
            "institution",
            "city",
            "publisher_username",
            "publisher_profile_image",
        ]

    def get_publisher_profile_image(self, obj):
        user = obj.institution.user
        return user.profile_image.url if user.profile_image else None

class SearchJobSerializer(serializers.ModelSerializer):
    institution = serializers.CharField(source="institution.title")
    city = serializers.CharField(source="institution.user.city")
    publisher_username = serializers.CharField(source="institution.user.username")
    publisher_profile_image = serializers.SerializerMethodField()

    class Meta:
        model = JobPost
        fields = [
            "id",
            "title",
            "description",
            "institution",
            "city",
            "publisher_username",
            "publisher_profile_image",
        ]

    def get_publisher_profile_image(self, obj):
        user = obj.institution.user
        return user.profile_image.url if user.profile_image else None

class StudentVerificationSerializer(serializers.ModelSerializer):
    studying_level = serializers.CharField()
    responsible_phone = serializers.CharField(required=False, allow_null=True)
    responsible_email = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'phone_number',
            'about',
            'profile_image',
            'idcard_back',
            'idcard_front',
            'residence_front',
            'residence_back',

            # student fields (manually added)
            'studying_level',
            'responsible_phone',
            'responsible_email',
        ]

    def validate(self, data):
        required_user_fields = [
            'phone_number',
            'about',
            'profile_image',
            'idcard_back',
            'idcard_front',
            'residence_front',
            'residence_back',
        ]

        required_student_fields = [
            'studying_level',
        ]

        for field in required_user_fields + required_student_fields:
            if field not in data or not data[field]:
                raise serializers.ValidationError({field: "This field is required."})

        return data

    def update(self, instance, validated_data):
        student = instance.student

        student.studying_level = validated_data.pop('studying_level')
        student.responsible_phone = validated_data.pop('responsible_phone', student.responsible_phone)
        student.responsible_email = validated_data.pop('responsible_email', student.responsible_email)
        student.save()

        for key, value in validated_data.items():
            setattr(instance, key, value)

        instance.is_verified = True
        instance.save()

        return instance

class LecturerVerificationSerializer(serializers.ModelSerializer):
    academic_achievement = serializers.CharField()
    specialty = serializers.CharField()
    skills = serializers.CharField()
    experience = serializers.IntegerField()
    free_time = serializers.CharField()

    class Meta:
        model = User
        fields = [
            'phone_number',
            'about',
            'profile_image',
            'idcard_back',
            'idcard_front',
            'residence_front',
            'residence_back',

            # lecturer-only fields
            'academic_achievement',
            'specialty',
            'skills',
            'experience',
            'free_time',
        ]

    def validate(self, data):
        required_user_fields = [
            'phone_number',
            'about',
            'profile_image',
            'idcard_back',
            'idcard_front',
            'residence_front',
            'residence_back',
        ]

        required_lecturer_fields = [
            'academic_achievement',
            'specialty',
            'skills',
            'experience',
            'free_time',
        ]

        for field in required_user_fields + required_lecturer_fields:
            if field not in data or not data[field]:
                raise serializers.ValidationError({field: "This field is required."})

        return data

    def update(self, instance, validated_data):
        lecturer = instance.lecturer

        lecturer.academic_achievement = validated_data.pop('academic_achievement')
        lecturer.specialty = validated_data.pop('specialty')
        lecturer.skills = validated_data.pop('skills')
        lecturer.experience = validated_data.pop('experience')
        lecturer.free_time = validated_data.pop('free_time')
        lecturer.save()

        for key, value in validated_data.items():
            setattr(instance, key, value)

        instance.is_verified = True
        instance.save()

        return instance




