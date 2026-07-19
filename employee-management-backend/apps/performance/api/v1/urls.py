from django.urls import path
from .views import PerformanceReviewListAPIView

app_name = "performance"

urlpatterns = [
    path("reviews/", PerformanceReviewListAPIView.as_view(), name="review-list"),
]
