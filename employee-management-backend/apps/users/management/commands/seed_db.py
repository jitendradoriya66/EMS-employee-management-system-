from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

from apps.departments.models import Department
from apps.employees.models import Employee
from apps.attendance.models import Attendance
from apps.leave.models import LeaveRequest
from apps.projects.models import Project, ProjectMember
from apps.tasks.models import Task
from apps.payroll.models import Salary, Payslip
from apps.performance.models import PerformanceReview
from apps.recruitment.models import JobPosting, Candidate
from apps.documents.models import Document
from apps.notifications.models import Notification
from apps.reports.models import Report
from apps.settings.models import SystemSetting, UserPreference

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds the database with mock data."

    def handle(self, *args, **options):
        self.stdout.write("Clearing existing data...")
        User.objects.all().delete()
        Department.objects.all().delete()
        Project.objects.all().delete()
        SystemSetting.objects.all().delete()

        self.stdout.write("Creating Departments...")
        eng_dept = Department.objects.create(name="Engineering", description="Software Development")
        hr_dept = Department.objects.create(name="HR", description="Human Resources")
        design_dept = Department.objects.create(name="Design", description="Product Design")
        sales_dept = Department.objects.create(name="Sales", description="Sales & Marketing")

        self.stdout.write("Creating Admin User...")
        admin_user = User.objects.create_superuser(email="admin@yopmail.com", password="admin", employee_id="EMP0001", first_name="System", last_name="Admin")
        admin_emp = Employee.objects.create(user=admin_user, department=hr_dept, position="Admin", salary=120000, status="active", start_date=timezone.now().date())

        self.stdout.write("Creating Employees...")
        # Manager
        mgr_user = User.objects.create_user(email="manager@yopmail.com", password="password", employee_id="EMP0002", first_name="Alice", last_name="Manager")
        mgr_emp = Employee.objects.create(user=mgr_user, department=eng_dept, position="Engineering Manager", salary=140000, status="active", start_date=timezone.now().date() - timedelta(days=365))
        eng_dept.manager = mgr_emp
        eng_dept.save()

        # Dev 1
        dev1_user = User.objects.create_user(email="dev1@yopmail.com", password="password", employee_id="EMP0003", first_name="Bob", last_name="Developer")
        dev1_emp = Employee.objects.create(user=dev1_user, department=eng_dept, manager=mgr_emp, position="Frontend Developer", salary=90000, status="active", start_date=timezone.now().date() - timedelta(days=100))

        # Dev 2
        dev2_user = User.objects.create_user(email="dev2@yopmail.com", password="password", employee_id="EMP0004", first_name="Charlie", last_name="Engineer")
        dev2_emp = Employee.objects.create(user=dev2_user, department=eng_dept, manager=mgr_emp, position="Backend Developer", salary=95000, status="active", start_date=timezone.now().date() - timedelta(days=200))

        # Designer
        des_user = User.objects.create_user(email="designer@yopmail.com", password="password", employee_id="EMP0005", first_name="Diana", last_name="Design")
        des_emp = Employee.objects.create(user=des_user, department=design_dept, position="UI/UX Designer", salary=85000, status="active", start_date=timezone.now().date() - timedelta(days=50))

        employees = [admin_emp, mgr_emp, dev1_emp, dev2_emp, des_emp]

        self.stdout.write("Generating Attendance Logs...")
        today = timezone.now().date()
        for emp in employees:
            for i in range(14):
                log_date = today - timedelta(days=i)
                # Skip weekends
                if log_date.weekday() >= 5:
                    continue
                Attendance.objects.create(
                    employee=emp,
                    date=log_date,
                    status=random.choice(["present", "present", "present", "late", "absent"]),
                    check_in_time=(timezone.now().replace(hour=9, minute=0, second=0) - timedelta(days=i)).time(),
                    check_out_time=(timezone.now().replace(hour=17, minute=0, second=0) - timedelta(days=i)).time(),
                    hours_worked=8.0
                )

        self.stdout.write("Generating Leave Requests...")
        LeaveRequest.objects.create(employee=dev1_emp, start_date=today + timedelta(days=1), end_date=today + timedelta(days=2), reason="Flu", status="approved")
        LeaveRequest.objects.create(employee=des_emp, start_date=today + timedelta(days=10), end_date=today + timedelta(days=14), reason="Vacation", status="pending")

        self.stdout.write("Generating Projects & Tasks...")
        p1 = Project.objects.create(name="Website Redesign", description="Overhaul company website", start_date=today - timedelta(days=30), status="in_progress", progress=45.0)
        p2 = Project.objects.create(name="Mobile App API", description="Build API for iOS app", start_date=today - timedelta(days=60), end_date=today + timedelta(days=30), status="in_progress", progress=80.0)

        ProjectMember.objects.create(project=p1, employee=mgr_emp, role="Project Manager")
        ProjectMember.objects.create(project=p1, employee=des_emp, role="Lead Designer")
        ProjectMember.objects.create(project=p1, employee=dev1_emp, role="Frontend Dev")

        ProjectMember.objects.create(project=p2, employee=mgr_emp, role="Project Manager")
        ProjectMember.objects.create(project=p2, employee=dev2_emp, role="Backend Dev")

        Task.objects.create(project=p1, assignee=des_emp, title="Wireframes", status="done")
        Task.objects.create(project=p1, assignee=dev1_emp, title="Implement Homepage", status="in_progress")
        Task.objects.create(project=p2, assignee=dev2_emp, title="Auth Endpoints", status="done")
        Task.objects.create(project=p2, assignee=dev2_emp, title="Payment Gateway", status="todo")

        self.stdout.write("Generating Payroll & Performance...")
        Salary.objects.create(employee=dev1_emp, base_salary=90000, effective_date=today - timedelta(days=100))
        Payslip.objects.create(employee=dev1_emp, period_start=today.replace(day=1) - timedelta(days=30), period_end=today.replace(day=28) - timedelta(days=30), gross_pay=7500, net_pay=6000, status="paid")

        PerformanceReview.objects.create(employee=dev1_emp, reviewer=mgr_emp, review_date=today, score=4.5, comments="Excellent work on React.", status="published")

        self.stdout.write("Generating Recruitment...")
        job = JobPosting.objects.create(title="Senior React Developer", description="Looking for a frontend guru.", department=eng_dept, status="open")
        Candidate.objects.create(applied_for=job, first_name="Eve", last_name="Hacker", email="eve@example.com", status="interviewing")
        Candidate.objects.create(applied_for=job, first_name="Frank", last_name="Smith", email="frank@example.com", status="applied")

        self.stdout.write("Generating Documents & Notifications...")
        Document.objects.create(employee=dev1_emp, title="Employment Contract", document_type="contract", file_url="https://example.com/contract.pdf")
        Notification.objects.create(user=dev1_user, title="Welcome", message="Welcome to the company!", is_read=True)
        Notification.objects.create(user=dev1_user, title="Task Assigned", message="You have been assigned to 'Implement Homepage'.", is_read=False)

        self.stdout.write("Generating Settings & Reports...")
        SystemSetting.objects.create(key="company_name", value="Acme Corp")
        UserPreference.objects.create(user=admin_user, theme="dark", notifications_enabled=True)
        UserPreference.objects.create(user=dev1_user, theme="light", notifications_enabled=True)
        Report.objects.create(title="Monthly Attendance", generated_by=admin_user, report_type="attendance", data_payload={"total_present": 45, "total_absent": 5})

        self.stdout.write(self.style.SUCCESS("Successfully seeded the database!"))
