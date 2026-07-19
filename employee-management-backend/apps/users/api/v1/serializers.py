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
    Serializer for listing users.
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
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
        )
        read_only_fields = fields


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user roles and status.
    """
    class Meta:
        model = User
        fields = (
            "is_active",
            "is_staff",
            "is_superuser",
        )


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
            "email",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
        )