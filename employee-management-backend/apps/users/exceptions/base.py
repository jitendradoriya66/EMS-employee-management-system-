from rest_framework.exceptions import APIException
from rest_framework import status


class BaseDomainException(APIException):
    """
    Base exception for all domain/business exceptions.
    """

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A business rule was violated."
    default_code = "business_error"