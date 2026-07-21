import uuid
from django.db import models

class Payslip(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('paid', 'Paid'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="payslips")
    period_start = models.DateField()
    period_end = models.DateField()
    gross_pay = models.DecimalField(max_digits=12, decimal_places=2)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)
    details = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    issued_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payslips"
        verbose_name = "Payslip"
        verbose_name_plural = "Payslips"
        ordering = ["-period_end"]

    def __str__(self):
        return f"Payslip {self.employee} ({self.period_start} to {self.period_end})"
