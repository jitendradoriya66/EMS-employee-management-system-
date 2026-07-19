from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.recruitment.models import JobPosting
from apps.recruitment.serializers.job_posting import JobPostingSerializer

class JobPostingListAPIView(generics.ListAPIView):
    queryset = JobPosting.objects.filter(status='open')
    serializer_class = JobPostingSerializer
    permission_classes = [IsAuthenticated]
