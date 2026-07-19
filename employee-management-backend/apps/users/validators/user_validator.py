from apps.users.repositories import UserRepository
from apps.users.exceptions import UserAlreadyExistsException


class UserValidator:
    """
    Business validations for User.
    """

    @staticmethod
    def validate_email(email):
        if UserRepository.get_by_email(email):
            raise UserAlreadyExistsException()

    @staticmethod
    def validate_employee_id(employee_id):
        if UserRepository.get_by_employee_id(employee_id):
            raise UserAlreadyExistsException()