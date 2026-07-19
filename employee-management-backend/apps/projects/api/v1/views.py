from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.projects.models import Project
from apps.projects.serializers.project import ProjectSerializer

class ProjectListAPIView(generics.ListAPIView):
    """
    API for listing all projects.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
