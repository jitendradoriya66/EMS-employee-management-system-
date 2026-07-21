from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.payroll.models import Payslip
from apps.payroll.serializers.payslip import PayslipSerializer
from apps.employees.models import Employee
from apps.payroll.services import PayrollService

class PayslipViewSet(viewsets.ModelViewSet):
    """
    API for listing payslips for the authenticated employee or all if admin.
    """
    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', 'employee') != 'employee':
            return Payslip.objects.all()
        try:
            employee = user.employee_profile
            return Payslip.objects.filter(employee=employee)
        except Employee.DoesNotExist:
            return Payslip.objects.none()

    @action(detail=False, methods=['post'])
    def generate(self, request):
        if not (request.user.is_staff or getattr(request.user, 'role', 'employee') in ['admin', 'hr', 'superadmin']):
            return Response({"detail": "Not authorized to generate payroll."}, status=status.HTTP_403_FORBIDDEN)
        
        month = request.data.get('month')
        year = request.data.get('year')
        
        if not month or not year:
            return Response({"detail": "Month and year are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            count = PayrollService.generate_payroll(int(year), int(month))
            return Response({"detail": f"Successfully generated {count} draft payslips."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not (request.user.is_staff or getattr(request.user, 'role', 'employee') in ['admin', 'hr', 'superadmin']):
            return Response({"detail": "Not authorized to approve payroll."}, status=status.HTTP_403_FORBIDDEN)
            
        payslip = self.get_object()
        if payslip.status == 'paid':
            return Response({"detail": "Payslip is already paid."}, status=status.HTTP_400_BAD_REQUEST)
            
        payslip.status = 'paid'
        payslip.save()
        return Response({"detail": "Payslip approved and marked as paid."}, status=status.HTTP_200_OK)
