from django.db import models
from django.conf import settings
from .base import SoftDeleteModel

class CommunicationNotification(SoftDeleteModel):
    TYPE_MESSAGE = 'message'
    TYPE_CALL = 'call'
    TYPE_MEETING = 'meeting'
    TYPE_MENTION = 'mention'

    TYPE_CHOICES = (
        (TYPE_MESSAGE, 'New Message'),
        (TYPE_CALL, 'Incoming Call'),
        (TYPE_MEETING, 'Meeting Invite'),
        (TYPE_MENTION, 'Chat Mention'),
    )

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='communication_notifications', db_index=True)
    type = models.CharField(max_length=15, choices=TYPE_CHOICES, db_index=True)
    title = models.CharField(max_length=255)
    body = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True, db_index=True)
    extra_data = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'communication_notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification ({self.type}) for {self.recipient.email}"
