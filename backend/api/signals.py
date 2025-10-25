from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Institution, Lecturer, Student

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.user_type == 'institution':
            Institution.objects.create(user=instance)
        elif instance.user_type == 'lecturer':
            Lecturer.objects.create(user=instance)
        elif instance.user_type == 'student':
            Student.objects.create(user=instance)
