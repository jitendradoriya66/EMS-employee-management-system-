from django.urls import path
from .views import NotificationListAPIView, BroadcastNotificationAPIView, MarkAllReadAPIView

app_name = "notifications"

urlpatterns = [
    path("", NotificationListAPIView.as_view(), name="notification-list"),
    path("broadcast/", BroadcastNotificationAPIView.as_view(), name="notification-broadcast"),
    path("mark-read/", MarkAllReadAPIView.as_view(), name="notification-mark-read"),
]
