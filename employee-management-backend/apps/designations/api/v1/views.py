from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from apps.designations.models.designation import Designation
from .serializers import DesignationSerializer

class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
