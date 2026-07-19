from rest_framework import serializers
from apps.leave.models import LeaveRequest

class LeaveRequestSerializer(serializers.ModelSerializer):
    employeeName = serializers.SerializerMethodField()
    department = serializers.CharField(source='employee.department.name', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = ("id", "employee", "employeeName", "department", "start_date", "end_date", "reason", "status", "created_at")
        read_only_fields = ("id", "employee", "status", "created_at")

    def get_employeeName(self, obj):
        if obj.employee and obj.employee.user:
            return f"{obj.employee.user.first_name} {obj.employee.user.last_name}"
        return None
