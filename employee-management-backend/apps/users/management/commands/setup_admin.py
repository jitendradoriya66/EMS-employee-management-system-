import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a superuser automatically for production environments'

    def handle(self, *args, **options):
        email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
        password = os.environ.get('ADMIN_PASSWORD', 'Admin@1234')

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.SUCCESS(f'Superuser {email} already exists.'))
            return

        # Handle required fields like employee_id in this specific project
        self.stdout.write(self.style.WARNING(f'Creating superuser: {email}'))
        user = User.objects.create_superuser(
            email=email,
            password=password,
            first_name='Super',
            last_name='Admin',
            employee_id='EMP-ADMIN-01',
            phone_number='0000000000'
        )
        self.stdout.write(self.style.SUCCESS(f'Successfully created superuser {email} with password {password}'))
