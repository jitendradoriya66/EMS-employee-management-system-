from django.urls import path
from .views import DocumentListAPIView

app_name = "documents"

urlpatterns = [
    path("", DocumentListAPIView.as_view(), name="document-list"),
]
