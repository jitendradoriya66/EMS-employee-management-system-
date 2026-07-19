import uuid
from django.db import models

class Document(models.Model):
    TYPE_CHOICES = [
        ('contract', 'Contract'),
        ('id', 'ID Document'),
        ('policy', 'Policy'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=255)
    file_url = models.URLField(max_length=1000)  # In a real app, this might be a FileField
    document_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='other')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "documents"
        verbose_name = "Document"
        verbose_name_plural = "Documents"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.title} ({self.employee})"
