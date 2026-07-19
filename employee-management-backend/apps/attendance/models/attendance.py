import uuid
from django.db import models

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('late', 'Late'),
        ('leave', 'Leave'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="attendance_logs")
    date = models.DateField()
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    hours_worked = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')

    class Meta:
        db_table = "attendance_logs"
        verbose_name = "Attendance Log"
        verbose_name_plural = "Attendance Logs"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.employee} - {self.date} ({self.status})"
