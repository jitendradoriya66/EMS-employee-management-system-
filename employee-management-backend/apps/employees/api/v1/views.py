from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.employees.models import Employee
from apps.employees.serializers.employee import (
    EmployeeListSerializer,
    EmployeeCreateSerializer,
    EmployeeUpdateSerializer
)

class EmployeeListAPIView(generics.ListAPIView):
    """
    API for listing all employees.
    """
    queryset = Employee.objects.select_related('user', 'department', 'manager__user').all()
    serializer_class = EmployeeListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

class EmployeeCreateAPIView(generics.CreateAPIView):
    """
    API for creating a new employee.
    """
    queryset = Employee.objects.all()
    serializer_class = EmployeeCreateSerializer
    permission_classes = [IsAuthenticated]

class EmployeeRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API for retrieving, updating, and deleting an employee.
    """
    queryset = Employee.objects.select_related('user', 'department', 'manager__user').all()
    serializer_class = EmployeeUpdateSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        # We also want to delete the underlying user account to keep the system clean.
        user = instance.user
        instance.delete()
        user.delete()

