from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.departments.models.department import Department
from apps.departments.api.v1.serializers import DepartmentSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
