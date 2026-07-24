from django.db import models
from django.conf import settings
from .base import SoftDeleteModel
from .conversation import Conversation

class Message(SoftDeleteModel):
    FILE_IMAGE = 'image'
    FILE_PDF = 'pdf'
    FILE_DOC = 'doc'
    FILE_EXCEL = 'excel'
    FILE_ZIP = 'zip'
    FILE_VIDEO = 'video'
    FILE_VOICE = 'voice'

    FILE_TYPE_CHOICES = (
        (FILE_IMAGE, 'Image'),
        (FILE_PDF, 'PDF Document'),
        (FILE_DOC, 'Word Document'),
        (FILE_EXCEL, 'Excel Sheet'),
        (FILE_ZIP, 'ZIP Archive'),
        (FILE_VIDEO, 'Video'),
        (FILE_VOICE, 'Voice Note'),
    )

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages', db_index=True)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages', db_index=True)
    text = models.TextField(null=True, blank=True)
    file_path = models.CharField(max_length=500, null=True, blank=True)
    file_type = models.CharField(max_length=15, choices=FILE_TYPE_CHOICES, null=True, blank=True, db_index=True)
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)  # For visual replacement like "This message was deleted"

    class Meta:
        db_table = 'communication_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"Msg {self.id} by {self.sender.email}"

class MessageReceipt(SoftDeleteModel):
    STATUS_SENT = 'sent'
    STATUS_DELIVERED = 'delivered'
    STATUS_READ = 'read'

    STATUS_CHOICES = (
        (STATUS_SENT, 'Sent'),
        (STATUS_DELIVERED, 'Delivered'),
        (STATUS_READ, 'Read'),
    )

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='receipts', db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_receipts', db_index=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_SENT, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'communication_message_receipts'
        unique_together = ('message', 'user')

    def __str__(self):
        return f"{self.user.email} - {self.status} - {self.message.id}"

class MessageReaction(SoftDeleteModel):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions', db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_reactions', db_index=True)
    emoji = models.CharField(max_length=50, db_index=True)

    class Meta:
        db_table = 'communication_message_reactions'
        unique_together = ('message', 'user', 'emoji')

    def __str__(self):
        return f"{self.user.email} reacted {self.emoji} to {self.message.id}"
