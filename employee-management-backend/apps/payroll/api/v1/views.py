from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.payroll.models import Payslip
from apps.payroll.serializers.payslip import PayslipSerializer
from apps.employees.models import Employee

class PayslipViewSet(viewsets.ModelViewSet):
    """
    API for listing payslips for the authenticated employee or all if admin.
    """
    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', 'employee') != 'employee':
            return Payslip.objects.all()
        try:
            employee = user.employee_profile
            return Payslip.objects.filter(employee=employee)
        except Employee.DoesNotExist:
            return Payslip.objects.none()
