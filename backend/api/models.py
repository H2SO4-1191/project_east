from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import JSONField
from django.core.validators import RegexValidator
from django.contrib.postgres.fields import ArrayField
from datetime import time
from decimal import Decimal

phone_validator = RegexValidator(
    regex=r'^\+?\d{9,15}$',
    message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
)

timerange_validator = RegexValidator(
    regex=r'^(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d$',
    message="Format must be HH:MM-HH:MM (e.g. 09:00-17:00)"
)

keywords_validator = RegexValidator(
    regex=r'^[^,]+(,\s*[^,]+)+$',
    message="Enter values separated by commas (e.g. Physics, Mathematics, Programming, etc.)."
)

def upload_path(instance, file_name):
    return f"{instance.username}/{file_name}"

def upload_course_path(instance, file_name):
    return f"{instance.institution.username}/courses/{file_name}"

def upload_post_path(instance, file_name):
    return f"{instance.post.user.username}/posts/{file_name}"

def upload_staff_path(instance, file_name):
    first = instance.first_name.replace(" ", "_").lower()
    last = instance.last_name.replace(" ", "_").lower()
    staff_folder = f"{first}_{last}"
    return f"{instance.institution.user.username}/staff/{staff_folder}/{file_name}"

class User(AbstractUser):
    USER_TYPES = (
        ('institution', 'Institution'),
        ('lecturer', 'Lecturer'),
        ('student', 'Student'),
    )
    CITY_CHOICES = (
        ('baghdad', 'Baghdad'),
        ('basra', 'Basra'),
        ('maysan', 'Maysan'),
        ('dhi_qar', 'Dhi Qar'),
        ('muthanna', 'Muthanna'),
        ('qadisiyyah', 'Qadisiyyah'),
        ('najaf', 'Najaf'),
        ('karbala', 'Karbala'),
        ('babel', 'Babel'),
        ('wasit', 'Wasit'),
        ('anbar', 'Anbar'),
        ('salah_al_din', 'Salah Al-Din'),
        ('kirkuk', 'Kirkuk'),
        ('diyala', 'Diyala'),
        ('mosul', 'Mosul'),
        ('erbil', 'Erbil'),
        ('duhok', 'Duhok'),
        ('sulaymaniyah', 'Sulaymaniyah'),
    )
    first_name = models.CharField(max_length=100, blank=False, null=False)
    last_name = models.CharField(max_length=100, blank=False, null=False)
    email = models.EmailField(max_length=250, unique=True, null=False, blank=False)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, null=False, blank=False)
    city = models.CharField(max_length=255, choices=CITY_CHOICES, default='baghdad')
    phone_number = models.CharField(max_length=15, blank=True, null=True, validators=[phone_validator])
    about = models.CharField(max_length=1000, blank=True, null=True)
    profile_image = models.ImageField(upload_to=upload_path, blank=True, null=True)
    idcard_back = models.ImageField(upload_to=upload_path, blank=True, null=True)
    idcard_front = models.ImageField(upload_to=upload_path, blank=True, null=True)
    residence_front = models.ImageField(upload_to=upload_path, blank=True, null=True)
    residence_back = models.ImageField(upload_to=upload_path, blank=True, null=True)
    instagram_link = models.URLField(max_length=500, blank=True, null=True)
    facebook_link = models.URLField(max_length=500, blank=True, null=True)
    x_link = models.URLField(max_length=500, blank=True, null=True)
    tiktok_link = models.URLField(max_length=500, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_generated = models.DateTimeField(blank=True, null=True)
    REQUIRED_FIELDS=['first_name', 'last_name', 'email', 'city','user_type']
    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.lower()
        if not self.password:
            self.set_unusable_password()
        super().save(*args, **kwargs)

class Institution(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    marked_lecturers = models.ManyToManyField("Lecturer", related_name="marked_by_institutions", blank=True)


    def __str__(self):
        return self.title

class Lecturer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    institutions = models.ManyToManyField(Institution, related_name='lecturers')
    academic_achievement = models.CharField(max_length=255)
    specialty = models.CharField(max_length=255, default='')
    skills = models.CharField(max_length=1000, blank=True, null=True)
    experience = models.PositiveIntegerField(blank=True, null=True)
    free_time = models.CharField(max_length=20, blank=True, null=True, validators=[timerange_validator])
    def __str__(self):
        return self.user.username

class Course(models.Model):
    COURSE_LEVEL_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )
    title = models.CharField(max_length=255)
    about = models.CharField(max_length=1000)
    course_image = models.ImageField(upload_to=upload_course_path, blank=True, null=True)
    starting_date = models.DateField()
    ending_date = models.DateField()
    level = models.CharField(max_length=255, choices=COURSE_LEVEL_CHOICES, default='beginner')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal(0))

    DAYS = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]

    days = ArrayField(models.CharField(max_length=10, choices=DAYS), default=list)
    start_time = models.TimeField(default=time(9, 0))
    end_time = models.TimeField(default=time(10, 0))

    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='courses')
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='courses')

    capacity = models.PositiveIntegerField(default=0)  # 0 = unlimited
    total_lectures = models.PositiveIntegerField(default=0)  # number of sessions for this course

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    institutions = models.ManyToManyField(Institution, related_name='students')
    courses = models.ManyToManyField(Course, related_name='students')
    STUDYING_LEVEL_CHOICES = (
        ('primary', 'Primary'),
        ('intermediate', 'Intermediate'),
        ('high', 'High'),
        ('bachelors', 'Bachelors'),
        ('masters', 'Masters'),
        ('phd', 'PhD'),
        ('none', 'None'),
    )
    studying_level = models.CharField(max_length=20, choices=STUDYING_LEVEL_CHOICES)
    interesting_keywords = models.CharField(max_length=1000, blank=True, null=True, validators=[keywords_validator])
    responsible_phone = models.CharField(max_length=15, blank=True, null=True, validators=[phone_validator])
    responsible_email = models.EmailField(max_length=100, blank=True, null=True)
    def __str__(self):
        return self.user.username
    
class Staff(models.Model):
    first_name = models.CharField(max_length=100, blank=False, null=False)
    last_name = models.CharField(max_length=100, blank=False, null=False)
    phone_number = models.CharField(max_length=100, blank=False, null=False, validators=[phone_validator])
    personal_image = models.ImageField(upload_to=upload_staff_path)
    idcard_back = models.ImageField(upload_to=upload_staff_path, blank=True, null=True)
    idcard_front = models.ImageField(upload_to=upload_staff_path, blank=True, null=True)
    residence_front = models.ImageField(upload_to=upload_staff_path, blank=True, null=True)
    residence_back = models.ImageField(upload_to=upload_staff_path, blank=True, null=True)
    duty = models.CharField(max_length=255, blank=False, null=False)
    salary = models.PositiveIntegerField(blank=False, null=False, default=0)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name="staff", null=True, blank=True) # nullable for dev only!
    is_active = models.BooleanField(default=True)

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=255)
    description = models.CharField(max_length=2048, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=upload_post_path)

class JobPost(models.Model):
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name="jobs")

    title = models.CharField(max_length=255)
    description = models.CharField(max_length=2000, blank=True, null=True)

    specialty = models.CharField(max_length=255)
    experience_required = models.PositiveIntegerField(default=0)
    skills_required = models.CharField(max_length=1000, blank=True, null=True)

    salary_offer = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class JobApplication(models.Model):
    job = models.ForeignKey(JobPost, on_delete=models.CASCADE, related_name="applications")
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name="applications")
    message = models.CharField(max_length=2000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("job", "lecturer")

    def __str__(self):
        return f"{self.lecturer.user.username} → {self.job.title}"

class Attendance(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
    )

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="attendances")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendances")
    lecture_number = models.PositiveIntegerField()  # 1 .. total_lectures
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("course", "student", "lecture_number")

class Exam(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="exams")
    title = models.CharField(max_length=255)
    date = models.DateField()
    max_score = models.PositiveIntegerField(default=100)

    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Grade(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="grades")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="grades")
    score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("exam", "student")
