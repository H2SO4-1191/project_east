from django.contrib import admin
from .models import User, Institution, Lecturer, Course, Student

admin.site.register([User, Institution, Lecturer, Course, Student])
