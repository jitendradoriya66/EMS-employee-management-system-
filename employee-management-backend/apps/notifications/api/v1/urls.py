from django.urls import path
from .views import (
    NotificationListAPIView, 
    AnnouncementListAPIView, 
    BroadcastNotificationAPIView, 
    MarkAllReadAPIView, 
    MarkAnnouncementsReadAPIView,
    MarkSingleReadAPIView
)

app_name = "notifications"

urlpatterns = [
    path("", NotificationListAPIView.as_view(), name="notification-list"),
    path("<uuid:pk>/mark-read/", MarkSingleReadAPIView.as_view(), name="notification-mark-single-read"),
    path("announcements/", AnnouncementListAPIView.as_view(), name="announcement-list"),
    path("broadcast/", BroadcastNotificationAPIView.as_view(), name="notification-broadcast"),
    path("mark-read/", MarkAllReadAPIView.as_view(), name="notification-mark-read"),
    path("announcements/mark-read/", MarkAnnouncementsReadAPIView.as_view(), name="announcement-mark-read"),
]
