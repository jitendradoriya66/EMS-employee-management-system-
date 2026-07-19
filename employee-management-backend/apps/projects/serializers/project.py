from rest_framework import serializers
from apps.projects.models import Project

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name", "description", "start_date", "end_date", "status", "progress", "created_at")
        read_only_fields = fields
