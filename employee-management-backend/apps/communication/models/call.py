from django.db import models
from django.conf import settings
from .base import SoftDeleteModel
from .conversation import Conversation

class Call(SoftDeleteModel):
    TYPE_VOICE = 'voice'
    TYPE_VIDEO = 'video'

    TYPE_CHOICES = (
        (TYPE_VOICE, 'Voice Call'),
        (TYPE_VIDEO, 'Video Call'),
    )

    STATUS_RINGING = 'ringing'
    STATUS_CONNECTED = 'connected'
    STATUS_MISSED = 'missed'
    STATUS_COMPLETED = 'completed'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = (
        (STATUS_RINGING, 'Ringing'),
        (STATUS_CONNECTED, 'Connected'),
        (STATUS_MISSED, 'Missed'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_REJECTED, 'Rejected'),
    )

    conversation = models.ForeignKey(Conversation, on_delete=models.SET_NULL, null=True, blank=True, related_name='calls', db_index=True)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hosted_calls', db_index=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=TYPE_VOICE, db_index=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_RINGING, db_index=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(default=0)  # In seconds

    class Meta:
        db_table = 'communication_calls'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type.upper()} call by {self.host.email} ({self.status})"

class CallParticipant(SoftDeleteModel):
    call = models.ForeignKey(Call, on_delete=models.CASCADE, related_name='participants', db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='call_participations', db_index=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'communication_call_participants'
        unique_together = ('call', 'user')

    def __str__(self):
        return f"{self.user.email} in call {self.call.id}"
