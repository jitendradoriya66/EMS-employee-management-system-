import uuid
from django.db import models

class Candidate(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('interviewing', 'Interviewing'),
        ('offered', 'Offered'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applied_for = models.ForeignKey("recruitment.JobPosting", on_delete=models.CASCADE, related_name="candidates")
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    applied_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "candidates"
        verbose_name = "Candidate"
        verbose_name_plural = "Candidates"
        ordering = ["-applied_date"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.applied_for})"
