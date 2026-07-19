import uuid
from django.db import models
from django.conf import settings

class Employee(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('on-leave', 'On Leave'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="employee_profile")
    department = models.ForeignKey("departments.Department", on_delete=models.SET_NULL, null=True, blank=True, related_name="employees")
    position = models.CharField(max_length=100, blank=True)
    start_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    manager = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="team_members")
    performance_score = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = "employees"
        verbose_name = "Employee"
        verbose_name_plural = "Employees"
        ordering = ["user__first_name", "user__last_name"]

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} - {self.position}"
