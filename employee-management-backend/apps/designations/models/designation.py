from django.db import models
from apps.core.models.base import TimeStampedModel

class Designation(TimeStampedModel):
    title = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    level = models.IntegerField(default=1)

    class Meta:
        db_table = "designations"
        verbose_name = "Designation"
        verbose_name_plural = "Designations"
        ordering = ["level"]

    def __str__(self):
        return self.title
