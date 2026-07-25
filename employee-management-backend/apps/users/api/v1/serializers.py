from rest_framework import serializers

from apps.users.models import User
from apps.users.services import UserService


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating users.
    """
    employee_id = serializers.CharField(read_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "employee_id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "profile_image",
            "password",
        )

    def create(self, validated_data):
        return UserService.create_user(**validated_data)


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing users with profile fields.
    """
    department = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    last_login = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "employee_id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
            "department",
            "role",
        )
        read_only_fields = fields

    def get_department(self, obj):
        try:
            profile = obj.employee_profile
            if profile and profile.department:
                return profile.department.name
        except Exception:
            pass
        return "Unassigned"

    def get_role(self, obj):
        if obj.is_superuser:
            return "super_admin"
        if obj.is_staff:
            return "admin_hr"
        return "employee"


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user roles, status, and profile details.
    """
    department = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "is_active",
            "is_staff",
            "is_superuser",
            "first_name",
            "last_name",
            "email",
            "department",
        )

    def update(self, instance, validated_data):
        department_name = validated_data.pop("department", None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update associated employee profile department
        if department_name is not None:
            from apps.departments.models import Department
            try:
                dept_obj = None
                if department_name != "Unassigned":
                    dept_obj = Department.objects.filter(name=department_name).first()
                
                profile = getattr(instance, "employee_profile", None)
                if profile:
                    profile.department = dept_obj
                    profile.save()
            except Exception as e:
                print("Failed to update user profile department:", e)

        return instance


class CurrentUserSerializer(serializers.ModelSerializer):
    """
    Serializer for the authenticated user to update their own profile.
    Only safe, non-privilege fields are exposed.
    """
    class Meta:
        model = User
        fields = (
            "id",
            "employee_id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "profile_image",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "employee_id",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
        )