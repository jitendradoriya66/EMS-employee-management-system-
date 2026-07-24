from rest_framework import serializers
from apps.employees.models import Employee
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.departments.models import Department
import uuid
import secrets
import string

User = get_user_model()
from apps.attendance.serializers.attendance import AttendanceSerializer

class EmployeeListSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='user.first_name', read_only=True)
    lastName = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone_number', read_only=True)
    department = serializers.CharField(source='department.name', read_only=True)
    manager = serializers.SerializerMethodField()
    attendanceLog = AttendanceSerializer(source='attendance_logs', many=True, read_only=True)
    projects = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = (
            "id",
            "firstName",
            "lastName",
            "email",
            "phone",
            "department",
            "position",
            "start_date",
            "status",
            "salary",
            "manager",
            "performance_score",
            "attendanceLog",
            "projects",
        )

    def get_manager(self, obj):
        if obj.manager and obj.manager.user:
            return f"{obj.manager.user.first_name} {obj.manager.user.last_name}"
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
            is_admin = user.is_staff or getattr(user, 'role', 'employee') != 'employee'
            # If the user is not an admin, and they are viewing someone else's record:
            if not is_admin and instance.user != user:
                data.pop('salary', None)
                data.pop('performance_score', None)
        return data

    def get_projects(self, obj):
        assignments = obj.project_assignments.select_related('project').all()
        return [
            {
                "name": assignment.project.name,
                "progress": assignment.project.progress,
                "role": assignment.role
            }
            for assignment in assignments
        ]

class EmployeeCreateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.CharField(write_only=True, required=False, default='employee')

    class Meta:
        model = Employee
        fields = (
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "department_name",
            "position",
            "start_date",
            "status",
            "salary",
        )

    def create(self, validated_data):
        with transaction.atomic():
            first_name = validated_data.pop('first_name')
            last_name = validated_data.pop('last_name')
            email = validated_data.pop('email')
            phone_number = validated_data.pop('phone_number', '')
            department_name = validated_data.pop('department_name', None)
            
            # Resolve role
            role = validated_data.pop('role', 'employee')
            is_staff = role in ['admin_hr', 'super_admin', 'admin', 'hr']
            is_superuser = role == 'super_admin'

            # Create User
            employee_id = f"EMP{str(uuid.uuid4())[:8].upper()}"
            # Generate default credentials
            default_password = 'Welcome@123'
            user = User.objects.create_user(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone_number=phone_number,
                password=default_password,
                employee_id=employee_id,
                is_active=True,
                is_staff=is_staff,
                is_superuser=is_superuser,
            )

            # Resolve department
            department = None
            if department_name:
                department, _ = Department.objects.get_or_create(name=department_name)
            
            validated_data['user'] = user
            if department:
                validated_data['department'] = department

            employee = Employee.objects.create(**validated_data)
            return employee

    def to_representation(self, instance):
        return EmployeeListSerializer(instance).data

class EmployeeUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Employee
        fields = (
            "first_name",
            "last_name",
            "phone_number",
            "department_name",
            "position",
            "start_date",
            "status",
            "salary",
        )

    def update(self, instance, validated_data):
        with transaction.atomic():
            # Extract user data
            first_name = validated_data.pop('first_name', None)
            last_name = validated_data.pop('last_name', None)
            phone_number = validated_data.pop('phone_number', None)
            
            if first_name is not None:
                instance.user.first_name = first_name
            if last_name is not None:
                instance.user.last_name = last_name
            if phone_number is not None:
                instance.user.phone_number = phone_number
            instance.user.save()

            # Extract department
            department_name = validated_data.pop('department_name', None)
            if department_name:
                department, _ = Department.objects.get_or_create(name=department_name)
                instance.department = department

            # Update remaining employee fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            instance.save()
            return instance

    def to_representation(self, instance):
        return EmployeeListSerializer(instance).data
