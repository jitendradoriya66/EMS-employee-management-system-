from django.urls import path
from .views import UserPreferenceAPIView

app_name = "settings"

urlpatterns = [
    path("preferences/", UserPreferenceAPIView.as_view(), name="preferences"),
]
