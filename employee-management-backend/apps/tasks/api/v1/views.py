from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.tasks.models.task import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', 'employee') != 'employee':
            return Task.objects.all()
        
        # Regular employees only see their own tasks
        if hasattr(user, 'employee_profile'):
            return Task.objects.filter(assignee=user.employee_profile)
        return Task.objects.none()