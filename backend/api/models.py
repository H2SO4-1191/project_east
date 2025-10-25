from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import JSONField
from django.core.validators import RegexValidator

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
    return f"media/{instance.email}/{file_name}"

def upload_course_path(instance, file_name):
    return f"media/{instance.lecturer.email}/courses/{file_name}"

class User(AbstractUser):
    USER_TYPES = (
        ('institution', 'Institution'),
        ('lecturer', 'Lecturer'),
        ('student', 'Student'),
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPES)
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
    experience = models.CharField(max_length=1000, blank=True, null=True)
    free_time = models.CharField(max_length=20, blank=True, null=True, validators=[timerange_validator])
    def __str__(self):
        return self.user.username

class Course(models.Model):
    title = models.CharField(max_length=255)
    about = models.CharField(max_length=1000)
    course_image = models.ImageField(upload_to=upload_course_path, blank=True, null=True)
    starting_date = models.DateField()
    ending_date = models.DateField()
    schedule = JSONField(default=dict)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='courses')
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='courses')
    def __str__(self):
        return self.title

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
    

    