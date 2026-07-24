from django.db import models
from django.conf import settings
from .base import SoftDeleteModel

class Conversation(SoftDeleteModel):
    TYPE_DIRECT = 'direct'
    TYPE_GROUP = 'group'
    
    TYPE_CHOICES = (
        (TYPE_DIRECT, 'Direct Message'),
        (TYPE_GROUP, 'Group Chat'),
    )

    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=TYPE_DIRECT, db_index=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'communication_conversations'
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.type.upper()} - {self.title or self.id}"

class ConversationMember(SoftDeleteModel):
    ROLE_OWNER = 'owner'
    ROLE_ADMIN = 'admin'
    ROLE_MEMBER = 'member'

    ROLE_CHOICES = (
        (ROLE_OWNER, 'Owner'),
        (ROLE_ADMIN, 'Admin'),
        (ROLE_MEMBER, 'Member'),
    )

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='members', db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversation_memberships', db_index=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_MEMBER, db_index=True)
    is_muted = models.BooleanField(default=False)
    muted_until = models.DateTimeField(null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'communication_conversation_members'
        unique_together = ('conversation', 'user')
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.email} in {self.conversation.id} ({self.role})"
