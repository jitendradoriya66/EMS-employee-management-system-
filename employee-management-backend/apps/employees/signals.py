from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.employees.models.employee import Employee
from apps.departments.models.department import Department

User = get_user_model()

@receiver(post_save, sender=User)
def create_or_update_employee_profile(sender, instance, created, **kwargs):
    # Get or create Employee profile
    employee, emp_created = Employee.objects.get_or_create(user=instance)

    # Sync fields depending on user status (superuser/staff/employee)
    if instance.is_superuser:
        # Super Admin
        admin_dept, _ = Department.objects.get_or_create(
            name="Administration",
            defaults={"description": "Executive and admin management team."}
        )
        employee.department = admin_dept
        employee.position = "Super Admin"
        employee.status = "active"
        employee.save()
    elif instance.is_staff:
        # HR / Admin staff
        hr_dept, _ = Department.objects.get_or_create(
            name="HR",
            defaults={"description": "Human Resources and operations team."}
        )
        employee.department = hr_dept
        employee.position = "HR Admin"
        employee.status = "active"
        employee.save()
    else:
        # Regular employee
        if emp_created:
            employee.position = "Employee"
            employee.status = "active"
            employee.save()
