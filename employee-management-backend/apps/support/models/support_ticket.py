from django.db import models
from apps.core.models.base import TimeStampedModel

class SupportTicket(TimeStampedModel):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    raised_by = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="tickets")
    assigned_to = models.ForeignKey("employees.Employee", on_delete=models.SET_NULL, null=True, related_name="assigned_tickets")

    class Meta:
        db_table = "support_tickets"
        verbose_name = "Support Ticket"
        verbose_name_plural = "Support Tickets"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
