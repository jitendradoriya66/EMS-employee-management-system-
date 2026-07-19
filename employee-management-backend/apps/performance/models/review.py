import uuid
from django.db import models

class PerformanceReview(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="performance_reviews")
    reviewer = models.ForeignKey("employees.Employee", on_delete=models.SET_NULL, null=True, related_name="reviews_given")
    review_date = models.DateField()
    score = models.FloatField()
    comments = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "performance_reviews"
        verbose_name = "Performance Review"
        verbose_name_plural = "Performance Reviews"
        ordering = ["-review_date"]

    def __str__(self):
        return f"Review for {self.employee} by {self.reviewer} on {self.review_date}"
