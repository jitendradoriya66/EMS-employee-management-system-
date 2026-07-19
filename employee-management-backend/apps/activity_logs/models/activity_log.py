from django.db import models
from apps.core.models.base import TimeStampedModel

class ActivityLog(TimeStampedModel):
    user = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, related_name="activities")
    action = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "activity_logs"
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.action} at {self.created_at}"
