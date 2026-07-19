import uuid
from django.db import models

class JobPosting(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('draft', 'Draft'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    department = models.ForeignKey("departments.Department", on_delete=models.SET_NULL, null=True, related_name="job_postings")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    posted_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "job_postings"
        verbose_name = "Job Posting"
        verbose_name_plural = "Job Postings"
        ordering = ["-posted_date"]

    def __str__(self):
        return self.title
