from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConversationViewSet,
    MessageViewSet,
    CallViewSet,
    MeetingViewSet,
    NotificationViewSet
)

router = DefaultRouter()
router.register('conversations', ConversationViewSet, basename='conversation')
router.register('messages', MessageViewSet, basename='message')
router.register('calls', CallViewSet, basename='call')
router.register('meetings', MeetingViewSet, basename='meeting')
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
