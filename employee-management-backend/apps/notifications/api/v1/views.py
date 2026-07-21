from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from apps.notifications.models import Notification
from apps.notifications.serializers.notification import NotificationSerializer

User = get_user_model()

class NotificationListAPIView(generics.ListAPIView):
    """
    API for listing personal notifications for the authenticated user.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user, notification_type='personal')

class AnnouncementListAPIView(generics.ListAPIView):
    """
    API for listing announcements for the authenticated user.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user, notification_type='announcement')

class BroadcastNotificationAPIView(generics.CreateAPIView):
    """
    API for broadcasting an announcement to all users.
    Only accessible to admins/staff.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, *args, **kwargs):
        title = request.data.get('title')
        message = request.data.get('message')
        
        if not title or not message:
            return Response({"detail": "Title and message are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        users = User.objects.all()
        notifications = [
            Notification(user=u, title=title, message=message, notification_type='announcement')
            for u in users
        ]
        Notification.objects.bulk_create(notifications)
        
        return Response({"detail": f"Announcement broadcasted to {len(users)} employees."}, status=status.HTTP_201_CREATED)

class MarkAllReadAPIView(generics.GenericAPIView):
    """
    API for marking all personal notifications as read for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        Notification.objects.filter(user=request.user, is_read=False, notification_type='personal').update(is_read=True)
        return Response({"detail": "All notifications marked as read."}, status=status.HTTP_200_OK)

class MarkAnnouncementsReadAPIView(generics.GenericAPIView):
    """
    API for marking all announcements as read for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        Notification.objects.filter(user=request.user, is_read=False, notification_type='announcement').update(is_read=True)
        return Response({"detail": "All announcements marked as read."}, status=status.HTTP_200_OK)
