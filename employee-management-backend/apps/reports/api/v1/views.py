from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.reports.models import Report
from apps.reports.serializers.report import ReportSerializer

class ReportListAPIView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Report.objects.filter(generated_by=self.request.user)
