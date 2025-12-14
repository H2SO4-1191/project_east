from django.contrib import admin
from .models import *

admin.site.register([
        User, 
        Institution, 
        Lecturer, 
        Course, 
        Student, 
        Staff, 
        Post, 
        PostImage, 
        JobPost, 
        JobApplication, 
        Attendance,
        Exam,
        Grade,
        InstitutionSubscription,
        CoursePayment,
    ]
)
