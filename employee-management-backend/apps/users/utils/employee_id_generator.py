from django.contrib.auth import get_user_model

User = get_user_model()


def generate_employee_id():
    """
    Generate the next employee ID.

    Format:
        EMP000001
        EMP000002
        EMP000003
    """

    last_user = (
        User.objects
        .order_by("-employee_id")
        .first()
    )

    if not last_user:
        return "EMP000001"

    last_number = int(last_user.employee_id.replace("EMP", ""))

    return f"EMP{last_number + 1:06d}"