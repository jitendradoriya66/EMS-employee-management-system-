from rest_framework import status

from .base import BaseDomainException


class UserAlreadyExistsException(BaseDomainException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A user with this email already exists."
    default_code = "user_already_exists"


class UserNotFoundException(BaseDomainException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "User not found."
    default_code = "user_not_found"


class InvalidUserStatusException(BaseDomainException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid user status."
    default_code = "invalid_user_status"