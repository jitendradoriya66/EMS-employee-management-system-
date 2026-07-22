import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates default admin, HR, and supervisor users for production environments'

    def handle(self, *args, **options):
        # 1. Super Admin
        self.setup_user(
            email=os.environ.get('ADMIN_EMAIL', 'admin@example.com'),
            password=os.environ.get('ADMIN_PASSWORD', 'Admin@1234'),
            first_name='Super',
            last_name='Admin',
            employee_id='EMP-ADMIN-01',
            is_staff=True,
            is_superuser=True
        )

        # 2. HR
        self.setup_user(
            email=os.environ.get('HR_EMAIL', 'hr@example.com'),
            password=os.environ.get('HR_PASSWORD', 'Hr@12345'),
            first_name='HR',
            last_name='Manager',
            employee_id='EMP-HR-01',
            is_staff=True,
            is_superuser=False
        )

        # 3. Supervisor
        self.setup_user(
            email=os.environ.get('SUPERVISOR_EMAIL', 'supervisor@example.com'),
            password=os.environ.get('SUPERVISOR_PASSWORD', 'Supervisor@123'),
            first_name='Team',
            last_name='Supervisor',
            employee_id='EMP-SUP-01',
            is_staff=True,
            is_superuser=False
        )

    def setup_user(self, email, password, first_name, last_name, employee_id, is_staff, is_superuser):
        user = User.objects.filter(email=email).first()
        if user:
            self.stdout.write(self.style.SUCCESS(f'User {email} already exists. Checking status...'))
            updated = False
            
            # Ensure the user is active, as requested
            if not user.is_active:
                user.is_active = True
                updated = True
                self.stdout.write(self.style.WARNING(f'User {email} was inactive. Reactivating...'))
            
            # Ensure roles (staff/superuser) are correct
            if user.is_staff != is_staff:
                user.is_staff = is_staff
                updated = True
                
            if user.is_superuser != is_superuser:
                user.is_superuser = is_superuser
                updated = True
                
            if updated:
                user.save()
                self.stdout.write(self.style.SUCCESS(f'User {email} updated successfully.'))
            else:
                self.stdout.write(self.style.SUCCESS(f'User {email} is up to date.'))
            return

        self.stdout.write(self.style.WARNING(f'Creating user: {email}'))
        
        if is_superuser:
            user = User.objects.create_superuser(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                employee_id=employee_id,
                phone_number='0000000000'
            )
        else:
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                employee_id=employee_id,
                phone_number='0000000000'
            )
            # Ensure is_staff is set for non-superusers (like HR)
            if is_staff:
                user.is_staff = True
                user.save()

        self.stdout.write(self.style.SUCCESS(f'Successfully created user {email} with password {password}'))
