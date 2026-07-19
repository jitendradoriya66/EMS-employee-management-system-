from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.support.models.support_ticket import SupportTicket
from .serializers import SupportTicketSerializer

class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', 'employee') != 'employee':
            return SupportTicket.objects.all()
        if hasattr(user, 'employee_profile'):
            return SupportTicket.objects.filter(employee=user.employee_profile)
        return SupportTicket.objects.none()
        
    def perform_create(self, serializer):
        try:
            serializer.save(employee=self.request.user.employee_profile)
        except Exception:
            serializer.save()
