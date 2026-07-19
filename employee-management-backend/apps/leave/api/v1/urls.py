from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaveRequestViewSet

app_name = "leave"

router = DefaultRouter()
router.register(r'', LeaveRequestViewSet, basename='leave')

urlpatterns = [
    path('', include(router.urls)),
]
