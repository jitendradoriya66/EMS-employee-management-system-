from django.urls import path
from .views import ProjectListAPIView

app_name = "projects"

urlpatterns = [
    path("", ProjectListAPIView.as_view(), name="project-list"),
]
