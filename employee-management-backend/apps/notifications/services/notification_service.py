import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from apps.notifications.models import Notification

User = get_user_model()

class NotificationService:
    @staticmethod
    def create_notification(user, title, message, notification_type='personal', extra_data=None):
        """
        Creates a notification in database and broadcasts it in real-time.
        """
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            extra_data=extra_data
        )
        
        # Broadcast via Django Channels
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                from apps.notifications.serializers.notification import NotificationSerializer
                notif_data = NotificationSerializer(notification).data
                notif_data['id'] = str(notif_data['id'])
                notif_data['user'] = str(notif_data['user'])
                notif_data['created_at'] = notification.created_at.isoformat()
                
                async_to_sync(channel_layer.group_send)(
                    f"user_{user.id}",
                    {
                        "type": "chat.notification",
                        "notification": notif_data
                    }
                )
        except Exception as e:
            print(f"Failed to broadcast real-time notification: {e}")
            
        return notification

    @staticmethod
    def broadcast_announcement(title, message):
        """
        Broadcasts an announcement to all users.
        """
        users = User.objects.all()
        created_notifications = []
        for u in users:
            notif = Notification.objects.create(
                user=u,
                title=title,
                message=message,
                notification_type='announcement'
            )
            created_notifications.append(notif)
        
        # Broadcast in real-time to each user group
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                from apps.notifications.serializers.notification import NotificationSerializer
                for notif in created_notifications:
                    notif_data = NotificationSerializer(notif).data
                    notif_data['id'] = str(notif_data['id'])
                    notif_data['user'] = str(notif_data['user'])
                    notif_data['created_at'] = notif.created_at.isoformat()
                    
                    async_to_sync(channel_layer.group_send)(
                        f"user_{notif.user.id}",
                        {
                            "type": "chat.notification",
                            "notification": notif_data
                        }
                    )
        except Exception as e:
            print(f"Failed to broadcast announcement WebSocket: {e}")
