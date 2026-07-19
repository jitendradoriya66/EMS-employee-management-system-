from django.db import models
from apps.core.models.base import TimeStampedModel

class Integration(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    api_key = models.CharField(max_length=255)
    webhook_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "integrations"
        verbose_name = "Integration"
        verbose_name_plural = "Integrations"

    def __str__(self):
        return self.name
