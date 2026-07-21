from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
from apps.attendance.models.attendance import Attendance
from apps.attendance.serializers.attendance import AttendanceSerializer

from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__department__name']
    filterset_fields = ['date', 'status']
    ordering_fields = ['date', 'employee__first_name']
    ordering = ['-date']

    def get_queryset(self):
        user = self.request.user
        # For simplicity, if not admin, only show own attendance
        # In a real app we would check if they have specific permissions
        if user.is_staff or user.is_superuser:
            return Attendance.objects.all()
        # Find employee profile for user
        if hasattr(user, 'employee_profile'):
            return Attendance.objects.filter(employee=user.employee_profile)
        return Attendance.objects.none()

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = self.filter_queryset(self.get_queryset())
        
        total = qs.count()
        present = qs.filter(status='present').count()
        late = qs.filter(status='late').count()
        leave = qs.filter(status='leave').count()
        avg_hours = qs.aggregate(avg=Avg('hours_worked'))['avg'] or 0

        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        daily_qs = qs.filter(date__gte=thirty_days_ago).values('date').annotate(
            present=Count('id', filter=Q(status='present')),
            late=Count('id', filter=Q(status='late')),
            leave=Count('id', filter=Q(status='leave'))
        ).order_by('-date')

        return Response({
            'total': total,
            'present': present,
            'late': late,
            'leave': leave,
            'average_hours': avg_hours,
            'daily_summary': list(daily_qs)
        })

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'employee_profile'):
            employee = user.employee_profile
            date_val = serializer.validated_data.get('date')
            
            # Prevent check-in if there is an active check-in (no check-out) for today
            if Attendance.objects.filter(employee=employee, date=date_val, check_out_time__isnull=True).exists():
                from rest_framework.exceptions import ValidationError
                raise ValidationError("You are already checked in. Please check out first.")
                
            instance = serializer.save(employee=employee)
            self.broadcast_attendance_update(instance, "check-in")
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("User has no associated employee profile.")

    def perform_update(self, serializer):
        instance = serializer.save()
        self.broadcast_attendance_update(instance, "check-out")

    def broadcast_attendance_update(self, instance, action_type):
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        from apps.attendance.serializers.attendance import AttendanceSerializer
        
        channel_layer = get_channel_layer()
        if channel_layer:
            data = AttendanceSerializer(instance).data
            # Inject employee info if needed
            async_to_sync(channel_layer.group_send)(
                "attendance_updates",
                {
                    "type": "attendance_message",
                    "message": {
                        "action": action_type,
                        "data": data
                    }
                }
            )
