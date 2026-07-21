from rest_framework import serializers
from apps.payroll.models import Payslip

class PayslipSerializer(serializers.ModelSerializer):
    employeeName = serializers.SerializerMethodField()
    department = serializers.CharField(source='employee.department.name', read_only=True)

    class Meta:
        model = Payslip
        fields = ("id", "employee", "employeeName", "department", "period_start", "period_end", "gross_pay", "net_pay", "details", "status", "issued_date")
        read_only_fields = fields

    def get_employeeName(self, obj):
        if obj.employee and obj.employee.user:
            return f"{obj.employee.user.first_name} {obj.employee.user.last_name}"
        return None
