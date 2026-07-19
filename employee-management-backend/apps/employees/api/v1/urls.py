from django.urls import path
from .views import (
    EmployeeListAPIView,
    EmployeeCreateAPIView,
    EmployeeRetrieveUpdateDestroyAPIView
)

app_name = "employees"

urlpatterns = [
    path("", EmployeeListAPIView.as_view(), name="employee-list"),
    path("create/", EmployeeCreateAPIView.as_view(), name="employee-create"),
    path("<uuid:pk>/", EmployeeRetrieveUpdateDestroyAPIView.as_view(), name="employee-detail"),
]
