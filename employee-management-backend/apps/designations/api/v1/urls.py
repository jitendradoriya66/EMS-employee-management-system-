from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DesignationViewSet

app_name = 'designations'

router = DefaultRouter()
router.register(r'', DesignationViewSet, basename='designations')

urlpatterns = [
    path('', include(router.urls)),
]
