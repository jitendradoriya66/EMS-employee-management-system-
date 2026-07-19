from django.contrib.auth import get_user_model

User = get_user_model()


class UserRepository:
    """
    Repository responsible for all database operations
    related to the User model.
    """

    @staticmethod
    def create_user(**validated_data):
        return User.objects.create_user(**validated_data)

    @staticmethod
    def get_by_id(user_id):
        return User.objects.filter(id=user_id).first()

    @staticmethod
    def get_by_email(email):
        return User.objects.filter(email=email).first()

    @staticmethod
    def get_by_employee_id(employee_id):
        return User.objects.filter(employee_id=employee_id).first()

    @staticmethod
    def get_all():
        return User.objects.all()

    @staticmethod
    def save(user):
        user.save()
        return user

    @staticmethod
    def delete(user):
        user.delete()