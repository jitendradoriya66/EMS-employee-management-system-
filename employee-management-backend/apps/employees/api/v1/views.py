from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.employees.models import Employee
from apps.employees.serializers.employee import (
    EmployeeListSerializer,
    EmployeeCreateSerializer,
    EmployeeUpdateSerializer
)

from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

class EmployeePagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class EmployeeListAPIView(generics.ListAPIView):
    """
    API for listing all employees.
    """
    serializer_class = EmployeeListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = EmployeePagination
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'department__name', 'position', 'user__employee_id']
    filterset_fields = ['department', 'status']
    ordering_fields = ['user__first_name', 'start_date']
    ordering = ['user__first_name']

    def get_queryset(self):
        return Employee.objects.select_related('user', 'department', 'manager__user').all()

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

