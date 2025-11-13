from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import JSONField
from django.core.validators import RegexValidator
from django.contrib.postgres.fields import ArrayField
from datetime import time

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
    return f"media/{instance.username}/{file_name}"

def upload_course_path(instance, file_name):
    return f"media/{instance.institution.username}/courses/{file_name}"

def upload_staff_path(instance, file_name):
    first = instance.first_name.replace(" ", "_").lower()
    last = instance.last_name.replace(" ", "_").lower()
    staff_folder = f"{first}_{last}"
    return f"media/{instance.institution.user.username}/staff/{staff_folder}/{file_name}"


class User(AbstractUser):
    USER_TYPES = (
        ('institution', 'Institution'),
        ('lecturer', 'Lecturer'),
        ('student', 'Student'),
    )
    first_name = models.CharField(max_length=100, blank=False, null=False)
    last_name = models.CharField(max_length=100, blank=False, null=False)
    email = models.EmailField(max_length=250, unique=True, null=False, blank=False)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, null=False, blank=False)
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
    REQUIRED_FIELDS=['first_name', 'last_name', 'email', 'user_type']
    def save(self, *args, **kwargs):
        if not self.password:
            self.set_unusable_password()
        super().save(*args, **kwargs)

class Institution(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
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
    title = models.CharField(max_length=255)
    about = models.CharField(max_length=1000)
    course_image = models.ImageField(upload_to=upload_course_path, blank=True, null=True)
    starting_date = models.DateField()
    ending_date = models.DateField()

    DAYS = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]

    days = ArrayField(models.CharField(max_length=10, choices=DAYS), default=list())
    start_time = models.TimeField(default=time(9, 0))
    end_time = models.TimeField(default=time(10, 0))

    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='courses')
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='courses')

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







