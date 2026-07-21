from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.attendance.models.attendance import Attendance
from apps.attendance.serializers.attendance import AttendanceSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

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
