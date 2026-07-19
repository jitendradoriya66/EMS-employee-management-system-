from django.db import models
from apps.core.models.base import TimeStampedModel

class AuditLog(TimeStampedModel):
    model_name = models.CharField(max_length=100)
    record_id = models.CharField(max_length=100)
    action = models.CharField(max_length=50) # create, update, delete
    changed_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)
    changes = models.JSONField(default=dict)

    class Meta:
        db_table = "audit_logs"
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.model_name} {self.action} by {self.changed_by}"
