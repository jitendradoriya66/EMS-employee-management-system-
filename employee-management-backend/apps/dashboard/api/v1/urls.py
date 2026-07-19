from django.urls import path
from .views import DashboardMetricsAPIView

app_name = 'dashboard'

urlpatterns = [
    path('', DashboardMetricsAPIView.as_view(), name='dashboard-metrics'),
]
