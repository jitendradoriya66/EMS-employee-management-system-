from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.employees.models.employee import Employee
from apps.leave.models.leave_request import LeaveRequest
from apps.support.models.support_ticket import SupportTicket

class DashboardMetricsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        # Calculate real metrics
        total_employees = Employee.objects.count()
        pending_leaves = LeaveRequest.objects.filter(status='pending').count()
        open_tickets = SupportTicket.objects.filter(status='open').count()
        
        return Response({
            "total_employees": total_employees,
            "pending_leaves": pending_leaves,
            "open_tickets": open_tickets,
        })
