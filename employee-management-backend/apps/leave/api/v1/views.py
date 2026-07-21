from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from apps.leave.models import LeaveRequest
from apps.leave.serializers.leave_request import LeaveRequestSerializer
from apps.employees.models import Employee
class LeaveRequestViewSet(viewsets.ModelViewSet):
    """
    API for creating and viewing leave requests.
    """
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', 'employee') != 'employee':
            return LeaveRequest.objects.all()
        if hasattr(user, 'employee_profile'):
            return LeaveRequest.objects.filter(employee=user.employee_profile)
        return LeaveRequest.objects.none()

    def perform_create(self, serializer):
        try:
            employee = self.request.user.employee_profile
            
            start_date = serializer.validated_data.get('start_date')
            end_date = serializer.validated_data.get('end_date')
            
            # Check overlap
            overlapping = LeaveRequest.objects.filter(
                employee=employee,
                status__in=['pending', 'approved'],
                start_date__lte=end_date,
                end_date__gte=start_date
            )
            if overlapping.exists():
                raise ValidationError("You already have a pending or approved leave request during this period.")
            
            # Check balance
            approved_leaves = LeaveRequest.objects.filter(employee=employee, status='approved')
            total_days_used = sum((req.end_date - req.start_date).days + 1 for req in approved_leaves)
            requested_days = (end_date - start_date).days + 1
            
            if total_days_used + requested_days > 20:
                raise ValidationError(f"Insufficient leave balance. You have {20 - total_days_used} days remaining.")

            serializer.save(employee=employee)
        except Employee.DoesNotExist:
            raise ValidationError("User does not have an associated employee profile.")

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminUser])
    def approve(self, request, pk=None):
        leave_request = self.get_object()
        leave_request.status = 'approved'
        leave_request.save()
        return Response({'status': 'Leave request approved'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminUser])
    def reject(self, request, pk=None):
        leave_request = self.get_object()
        leave_request.status = 'rejected'
        leave_request.save()
        return Response({'status': 'Leave request rejected'}, status=status.HTTP_200_OK)
