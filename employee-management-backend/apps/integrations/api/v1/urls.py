from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IntegrationViewSet

app_name = 'integrations'

router = DefaultRouter()
router.register(r'', IntegrationViewSet, basename='integrations')

urlpatterns = [
    path('', include(router.urls)),
]
