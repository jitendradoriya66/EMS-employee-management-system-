from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.documents.models import Document
from apps.documents.serializers.document import DocumentSerializer
from apps.employees.models import Employee

class DocumentListAPIView(generics.ListAPIView):
    """
    API for listing documents for the authenticated employee.
    """
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            employee = self.request.user.employee_profile
            return Document.objects.filter(employee=employee)
        except Employee.DoesNotExist:
            return Document.objects.none()
