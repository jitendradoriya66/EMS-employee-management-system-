import uuid
from django.db import models

class Salary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="salaries")
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    effective_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "salaries"
        verbose_name = "Salary"
        verbose_name_plural = "Salaries"
        ordering = ["-effective_date"]

    def __str__(self):
        return f"{self.employee} - {self.base_salary} (Active: {self.is_active})"
