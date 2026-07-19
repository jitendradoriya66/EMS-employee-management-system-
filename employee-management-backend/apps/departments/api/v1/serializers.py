from rest_framework import serializers
from apps.departments.models.department import Department

class DepartmentSerializer(serializers.ModelSerializer):
    headcount = serializers.SerializerMethodField()
    managerName = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ("id", "name", "description", "manager", "managerName", "headcount")

    def get_headcount(self, obj):
        # We can count the number of employees associated with this department
        return obj.employee_set.count() if hasattr(obj, 'employee_set') else 0

    def get_managerName(self, obj):
        if obj.manager and obj.manager.user:
            return f"{obj.manager.user.first_name} {obj.manager.user.last_name}"
        return "Department Lead"
