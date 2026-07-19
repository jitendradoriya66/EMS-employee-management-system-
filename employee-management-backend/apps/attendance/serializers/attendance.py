from rest_framework import serializers
from apps.attendance.models import Attendance
from apps.employees.models import Employee

class AttendanceEmployeeSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name', read_only=True)
    lastName = serializers.CharField(source='last_name', read_only=True)
    department = serializers.CharField(source='department_name', read_only=True)

    class Meta:
        model = Employee
        fields = ('id', 'firstName', 'lastName', 'department')

class AttendanceSerializer(serializers.ModelSerializer):
    employee = AttendanceEmployeeSerializer(read_only=True)
    checkIn = serializers.TimeField(source='check_in_time', format='%H:%M', required=False)
    checkOut = serializers.TimeField(source='check_out_time', format='%H:%M', required=False)
    hoursWorked = serializers.FloatField(source='hours_worked')

    class Meta:
        model = Attendance
        fields = (
            "id",
            "employee",
            "date",
            "checkIn",
            "checkOut",
            "hoursWorked",
            "status",
        )
