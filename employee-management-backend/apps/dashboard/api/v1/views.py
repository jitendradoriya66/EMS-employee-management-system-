from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Count
from django.utils import timezone
import datetime

from apps.employees.models.employee import Employee
from apps.leave.models.leave_request import LeaveRequest
from apps.attendance.models.attendance import Attendance

class DashboardMetricsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        user = request.user
        role = getattr(user, 'role', 'employee')
        is_admin = user.is_staff or role != 'employee'
        
        employee_id = request.query_params.get('employee_id')
        department_name = request.query_params.get('department_name')
        range_val = request.query_params.get('range', '30d')
        
        # Resolve employees matching filter
        employees = Employee.objects.all()
        if not is_admin:
            try:
                emp_profile = user.employee_profile
                employees = employees.filter(id=emp_profile.id)
            except Exception:
                employees = Employee.objects.none()
        else:
            if employee_id and employee_id != 'all':
                employees = employees.filter(id=employee_id)
            if department_name and department_name != 'all':
                employees = employees.filter(department__name=department_name)
        
        # Date cutoff for range
        today = datetime.date.today()
        date_cutoff = None
        if range_val == '7d':
            date_cutoff = today - datetime.timedelta(days=7)
        elif range_val == '30d':
            date_cutoff = today - datetime.timedelta(days=30)
        elif range_val == '90d':
            date_cutoff = today - datetime.timedelta(days=90)
            
        # Attendance logs
        attendance_qs = Attendance.objects.filter(employee__in=employees)
        if date_cutoff:
            attendance_qs = attendance_qs.filter(date__gte=date_cutoff)
            
        total_attendance = attendance_qs.count()
        present_count = attendance_qs.filter(status__in=['present', 'late']).count()
        attendance_rate = round((present_count / total_attendance) * 100) if total_attendance > 0 else 0
        
        if is_admin:
            active_workforce = employees.filter(status='active').count()
            
            # Active approved leaves today
            on_leave_count = LeaveRequest.objects.filter(
                employee__in=employees,
                status='approved',
                start_date__lte=today,
                end_date__gte=today
            ).count()
            
            payroll_total = employees.aggregate(total=Sum('salary'))['total'] or 0.0
            
            performance_employees = employees.filter(performance_score__gt=0)
            avg_performance = performance_employees.aggregate(avg=Avg('performance_score'))['avg']
            if avg_performance is not None:
                avg_performance = round(avg_performance)
            
            # Department headcount breakdown
            total_emp_count = employees.count()
            dept_counts = employees.values('department__name').annotate(count=Count('id')).order_by('-count')
            department_stats = []
            for item in dept_counts:
                dept_name = item['department__name'] or 'Unassigned'
                count = item['count']
                percentage = round((count / total_emp_count) * 100) if total_emp_count > 0 else 0
                department_stats.append({
                    'department': dept_name,
                    'count': count,
                    'percentage': percentage
                })
                
            # Trend data: present/late count per date
            trend_qs = attendance_qs.values('date').annotate(val=Count('id')).order_by('date')
            trend_data = []
            for item in trend_qs:
                trend_data.append({
                    'label': item['date'].strftime('%Y-%m-%d'),
                    'value': item['val']
                })
                
            # Recent activities
            recent_activities = []
            recent_employees = employees.order_by('-start_date')[:5]
            for emp in recent_employees:
                name = f"{emp.user.first_name} {emp.user.last_name}"
                dept = emp.department.name if emp.department else "Unassigned"
                start_date_str = emp.start_date.strftime('%Y-%m-%d') if emp.start_date else 'recently'
                recent_activities.append({
                    'title': f"Admin / HR added new Employee {name}",
                    'description': f"Position: {emp.position or 'Specialist'} • Started {start_date_str}",
                    'time': start_date_str,
                    'date': start_date_str
                })
                
            recent_attendance = attendance_qs.order_by('-date')[:3]
            for att in recent_attendance:
                emp_name = f"{att.employee.user.first_name} {att.employee.user.last_name}"
                check_in_str = att.check_in_time.strftime('%H:%M') if att.check_in_time else '09:00'
                date_str = att.date.strftime('%Y-%m-%d')
                recent_activities.append({
                    'title': f"{emp_name} checked in",
                    'description': f"Status: {att.status.upper()} • Department: {att.employee.department.name if att.employee.department else 'Unassigned'} • Time: {check_in_str}",
                    'time': date_str,
                    'date': date_str
                })
                
            recent_activities.sort(key=lambda x: x['date'], reverse=True)
            recent_activities = recent_activities[:6]
            
            return Response({
                "total_employees": total_emp_count,
                "active_workforce": active_workforce,
                "attendance_rate": attendance_rate,
                "on_leave": on_leave_count,
                "payroll_total": float(payroll_total),
                "avg_performance": avg_performance,
                "department_stats": department_stats,
                "trend_data": trend_data,
                "recent_activities": recent_activities
            })
            
        else:
            # Employee metrics
            try:
                emp = user.employee_profile
                salary = float(emp.salary) if emp.salary else 0.0
                perf_score = emp.performance_score or 100.0
            except Exception:
                salary = 0.0
                perf_score = 100.0
                
            total_hours = attendance_qs.aggregate(total=Sum('hours_worked'))['total'] or 0.0
            
            # Leave Balance (Mock calculation: 20 total - approved leaves)
            approved_leaves = LeaveRequest.objects.filter(employee__in=employees, status='approved')
            approved_days = 0
            for leave in approved_leaves:
                approved_days += (leave.end_date - leave.start_date).days + 1
            available_leave_balance = max(0, 20 - approved_days)
            
            # Trend data: hours worked per date
            trend_qs = attendance_qs.values('date').annotate(val=Sum('hours_worked')).order_by('date')
            trend_data = []
            for item in trend_qs:
                trend_data.append({
                    'label': item['date'].strftime('%Y-%m-%d'),
                    'value': float(item['val']) if item['val'] is not None else 0.0
                })
                
            # Recent activities
            recent_activities = []
            recent_attendance = attendance_qs.order_by('-date')[:5]
            for att in recent_attendance:
                check_in_str = att.check_in_time.strftime('%H:%M') if att.check_in_time else '09:00'
                date_str = att.date.strftime('%Y-%m-%d')
                recent_activities.append({
                    'title': "Checked in",
                    'description': f"Status: {att.status.upper()} • Worked: {att.hours_worked} hrs • Time: {check_in_str}",
                    'time': date_str,
                    'date': date_str
                })
                
            return Response({
                "my_attendance_rate": attendance_rate,
                "hours_logged": round(total_hours, 1),
                "available_leave_balance": available_leave_balance,
                "my_performance_score": perf_score,
                "my_monthly_salary": salary,
                "trend_data": trend_data,
                "recent_activities": recent_activities
            })

