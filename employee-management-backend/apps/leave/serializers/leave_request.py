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

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
            
            from django.utils import timezone
            if start_date < timezone.now().date():
                raise serializers.ValidationError({"start_date": "Start date cannot be in the past."})
                
        return data
