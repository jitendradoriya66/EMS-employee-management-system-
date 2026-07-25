import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

def default_notification_settings():
    return {
        "browser": True,
        "sound": True,
        "chat": True,
        "group": True,
        "voice_calls": True,
        "video_calls": True,
        "announcements": True,
        "tasks": True,
        "leave": True,
        "attendance": True,
        "other": True
    }

class UserPreference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="preferences")
    theme = models.CharField(max_length=20, default='light')
    notifications_enabled = models.BooleanField(default=True)
    notification_settings = models.JSONField(default=default_notification_settings, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_preferences"
        verbose_name = "User Preference"
        verbose_name_plural = "User Preferences"

    def __str__(self):
        return f"Preferences for {self.user}"
