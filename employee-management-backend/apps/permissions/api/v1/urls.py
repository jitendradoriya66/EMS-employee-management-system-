from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PermissionViewSet

app_name = 'permissions'

router = DefaultRouter()
router.register(r'', PermissionViewSet, basename='permissions')

urlpatterns = [
    path('', include(router.urls)),
]
