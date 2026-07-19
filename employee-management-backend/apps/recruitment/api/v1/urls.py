from django.urls import path
from .views import JobPostingListAPIView

app_name = "recruitment"

urlpatterns = [
    path("jobs/", JobPostingListAPIView.as_view(), name="job-list"),
]
