from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.performance.models import PerformanceReview
from apps.performance.serializers.review import PerformanceReviewSerializer
from apps.employees.models import Employee

class PerformanceReviewListAPIView(generics.ListAPIView):
    """
    API for listing performance reviews for the authenticated employee.
    """
    serializer_class = PerformanceReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            employee = self.request.user.employee_profile
            return PerformanceReview.objects.filter(employee=employee)
        except Employee.DoesNotExist:
            return PerformanceReview.objects.none()
