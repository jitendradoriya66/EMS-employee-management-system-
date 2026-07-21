from datetime import date, timedelta
import calendar
from decimal import Decimal
from django.db import transaction
from apps.employees.models import Employee
from apps.payroll.models import Payslip
from apps.attendance.models import Attendance
from apps.leave.models import LeaveRequest

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

        # We assume 22 working days in a month for standard calculation
        WORKING_DAYS = 22

        with transaction.atomic():
            for employee in active_employees:
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

                # Calculate days present
                attendance_records = Attendance.objects.filter(
                    employee=employee,
                    date__range=[period_start, period_end],
                    status__in=['present', 'late']
                )
                days_present = attendance_records.count()

                # Calculate approved leaves
                leaves = LeaveRequest.objects.filter(
                    employee=employee,
                    status='approved',
                    start_date__lte=period_end,
                    end_date__gte=period_start
                )
                
                leave_days = 0
                for leave in leaves:
                    # Only count days within this month
                    overlap_start = max(leave.start_date, period_start)
                    overlap_end = min(leave.end_date, period_end)
                    if overlap_start <= overlap_end:
                        # Add 1 for inclusive days
                        leave_days += (overlap_end - overlap_start).days + 1

                # Calculate unpaid absences
                total_credited_days = min(days_present + leave_days, WORKING_DAYS)
                absent_days = max(WORKING_DAYS - total_credited_days, 0)

                # Base salary calculations
                annual_salary = employee.salary or Decimal('0.00')
                monthly_base = round(annual_salary / Decimal('12.0'), 2)
                
                # Daily rate for absence deduction
                daily_rate = monthly_base / Decimal(WORKING_DAYS)
                absence_deduction = round(daily_rate * Decimal(absent_days), 2)
                
                # Tax calculation (e.g. standard 15% on remainder)
                taxable_amount = monthly_base - absence_deduction
                tax_deduction = round(taxable_amount * Decimal('0.15'), 2) if taxable_amount > 0 else Decimal('0.00')

                net_pay = monthly_base - absence_deduction - tax_deduction

                details = {
                    "working_days": WORKING_DAYS,
                    "days_present": days_present,
                    "leave_days": leave_days,
                    "absent_days": absent_days,
                    "monthly_base": str(monthly_base),
                    "absence_deduction": str(absence_deduction),
                    "tax_deduction": str(tax_deduction)
                }

                Payslip.objects.create(
                    employee=employee,
                    period_start=period_start,
                    period_end=period_end,
                    gross_pay=monthly_base,
                    net_pay=max(net_pay, Decimal('0.00')),
                    details=details,
                    status='draft'
                )
                generated_count += 1
                
        return generated_count
