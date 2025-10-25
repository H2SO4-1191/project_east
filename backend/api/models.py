from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    USER_TYPES = (
        ('institution', 'Institution'),
        ('lecturer', 'Lecturer'),
        ('student', 'Student'),
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPES)

class Institution(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    institution_name = models.CharField(max_length=255)
    def __str__(self):
        return self.institution_name

class Lecturer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    institutions = models.ManyToManyField(Institution, related_name='lecturers')
    department = models.CharField(max_length=255)
    def __str__(self):
        return self.user.username

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    institutions = models.ManyToManyField(Institution, related_name='students')
    major = models.CharField(max_length=255)
    def __str__(self):
        return self.user.username
