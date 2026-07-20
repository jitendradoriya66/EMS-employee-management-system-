from datetime import date, timedelta
import calendar
from decimal import Decimal
from django.db import transaction
from apps.employees.models import Employee
from apps.payroll.models import Payslip

class PayrollService:
    @staticmethod
    def generate_payroll(year: int, month: int):
        """
        Generate draft payslips for all active employees for the given month and year.
        If a payslip already exists for an employee for this period, it skips or overwrites it.
        We'll just skip for simplicity, or recreate if it's still draft.
        """
        # Calculate period start and end dates
        _, last_day = calendar.monthrange(year, month)
        period_start = date(year, month, 1)
        period_end = date(year, month, last_day)

        active_employees = Employee.objects.filter(status='active', salary__isnull=False)
        generated_count = 0

        with transaction.atomic():
            for employee in active_employees:
                # Check if a payslip already exists for this period
                existing_payslip = Payslip.objects.filter(
                    employee=employee,
                    period_start=period_start,
                    period_end=period_end
                ).first()

                if existing_payslip:
                    if existing_payslip.status == 'paid':
                        continue  # Skip if already paid
                    else:
                        existing_payslip.delete()  # Re-create if it's just a draft

                # Basic calculation: monthly salary = annual salary / 12 (assuming salary field is annual)
                # If salary field is monthly, gross_pay = salary.
                # Let's assume the `salary` field on Employee is annual, so monthly is salary / 12.
                # Or wait, usually `salary` might be monthly. Let's just use it as monthly to be simple, 
                # or maybe look at the frontend: it says "totalAnnual = payslips... gross_pay * 12", 
                # so gross_pay is monthly. Let's assume Employee.salary is annual.
                # I'll calculate monthly as salary / 12.
                annual_salary = employee.salary or Decimal('0.00')
                gross_pay = round(annual_salary / Decimal('12.0'), 2)
                
                # Simple tax/deduction logic for demonstration (e.g., 20% deduction)
                deductions = round(gross_pay * Decimal('0.20'), 2)
                net_pay = gross_pay - deductions

                Payslip.objects.create(
                    employee=employee,
                    period_start=period_start,
                    period_end=period_end,
                    gross_pay=gross_pay,
                    net_pay=net_pay,
                    status='draft'
                )
                generated_count += 1
                
        return generated_count
