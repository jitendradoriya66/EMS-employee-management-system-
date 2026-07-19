from django.db import models
from apps.core.models.base import TimeStampedModel

class Permission(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    codename = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    roles = models.ManyToManyField("roles.Role", related_name="permissions")

    class Meta:
        db_table = "permissions"
        verbose_name = "Permission"
        verbose_name_plural = "Permissions"

    def __str__(self):
        return self.name
