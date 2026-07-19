from apps.users.repositories import UserRepository
from apps.users.validators import UserValidator
from apps.users.utils.employee_id_generator import generate_employee_id


class UserService:
    """
    Handles business logic related to users.
    """

    @staticmethod
    def create_user(**validated_data):
        """
        Create a new user after performing business validations.
        """

        # Validate email uniqueness
        UserValidator.validate_email(validated_data["email"])

        # Generate employee ID automatically
        validated_data["employee_id"] = generate_employee_id()

        # Ensure new users are inactive by default pending admin approval
        validated_data["is_active"] = False

        # Create user through repository
        return UserRepository.create_user(**validated_data)