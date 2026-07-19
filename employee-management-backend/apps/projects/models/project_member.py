import uuid
from django.db import models

class ProjectMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="members")
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="project_assignments")
    role = models.CharField(max_length=100, default='Member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "project_members"
        verbose_name = "Project Member"
        verbose_name_plural = "Project Members"
        unique_together = ('project', 'employee')

    def __str__(self):
        return f"{self.employee} - {self.project} ({self.role})"
