from rest_framework import serializers
from apps.tasks.models.task import Task

class TaskSerializer(serializers.ModelSerializer):
    assigneeName = serializers.SerializerMethodField()
    projectName = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Task
        fields = ("id", "title", "description", "status", "due_date", "assignee", "assigneeName", "project", "projectName", "created_at")
        read_only_fields = ("id", "created_at")

    def get_assigneeName(self, obj):
        if obj.assignee and obj.assignee.user:
            return f"{obj.assignee.user.first_name} {obj.assignee.user.last_name}"
        return None