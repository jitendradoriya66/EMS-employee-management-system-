from django.utils import timezone
from apps.communication.models.notification import CommunicationNotification

class NotificationService:
    @staticmethod
    def create_notification(recipient, notification_type, title, body, extra_data=None):
        """
        Creates a new communication alert notification.
        """
        return CommunicationNotification.objects.create(
            recipient=recipient,
            type=notification_type,
            title=title,
            body=body,
            extra_data=extra_data
        )

    @staticmethod
    def mark_as_read(notification_id, recipient):
        """
        Marks notification as read.
        """
        notification = CommunicationNotification.objects.filter(id=notification_id, recipient=recipient).first()
        if notification and not notification.read_at:
            notification.read_at = timezone.now()
            notification.save(update_fields=['read_at', 'updated_at'])
        return notification

    @staticmethod
    def mark_all_as_read(recipient):
        """
        Marks all unread communication notifications as read.
        """
        CommunicationNotification.objects.filter(recipient=recipient, read_at__isnull=True).update(
            read_at=timezone.now()
        )
