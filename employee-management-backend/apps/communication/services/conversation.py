from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from apps.communication.models.conversation import Conversation, ConversationMember

User = get_user_model()

class ConversationService:
    @staticmethod
    def get_or_create_direct_conversation(user1, user2):
        """
        Creates or retrieves a direct (private) conversation between two users.
        """
        if user1 == user2:
            raise ValidationError("Cannot create a direct conversation with yourself.")
            
        # Check active status
        if not user1.is_active or not user2.is_active:
            raise ValidationError("Both users must be active to initiate conversation.")

        # Find existing direct conversation involving exactly user1 and user2
        conversations = Conversation.objects.filter(
            type=Conversation.TYPE_DIRECT,
            members__user=user1,
            deleted_at__isnull=True
        ).filter(
            members__user=user2
        )

        for conversation in conversations:
            # Verify it has exactly 2 members
            if conversation.members.count() == 2:
                return conversation, False

        # Create new direct conversation
        with transaction.atomic():
            conversation = Conversation.objects.create(type=Conversation.TYPE_DIRECT)
            ConversationMember.objects.create(
                conversation=conversation,
                user=user1,
                role=ConversationMember.ROLE_MEMBER
            )
            ConversationMember.objects.create(
                conversation=conversation,
                user=user2,
                role=ConversationMember.ROLE_MEMBER
            )
        return conversation, True

    @staticmethod
    def create_group_conversation(owner, title, description=None, member_ids=None):
        """
        Creates a new group conversation with designated members.
        """
        if not title:
            raise ValidationError("Group title is required.")

        member_ids = member_ids or []
        MAX_MEMBERS = 100
        
        if len(member_ids) + 1 > MAX_MEMBERS:
            raise ValidationError(f"Maximum group limit is {MAX_MEMBERS} members.")

        # Exclude inactive/deleted employees
        active_users = User.objects.filter(id__in=member_ids, is_active=True)
        if len(active_users) != len(member_ids):
            raise ValidationError("One or more invited users are inactive or do not exist.")

        with transaction.atomic():
            conversation = Conversation.objects.create(
                type=Conversation.TYPE_GROUP,
                title=title,
                description=description
            )
            
            # Owner member record
            ConversationMember.objects.create(
                conversation=conversation,
                user=owner,
                role=ConversationMember.ROLE_OWNER
            )
            
            # Additional members
            for user in active_users:
                if user != owner:
                    ConversationMember.objects.create(
                        conversation=conversation,
                        user=user,
                        role=ConversationMember.ROLE_MEMBER
                    )

        # Broadcast conversation creation via WebSocket and generate notification
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            from apps.communication.serializers.conversation import ConversationListSerializer
            from apps.notifications.services.notification_service import NotificationService
            
            channel_layer = get_channel_layer()
            if channel_layer:
                convo_data = ConversationListSerializer(conversation).data
                convo_data['id'] = str(convo_data['id'])
                # Broadcast to each added user
                for member in ConversationMember.objects.filter(conversation=conversation, deleted_at__isnull=True):
                    async_to_sync(channel_layer.group_send)(
                        f"user_{member.user.id}",
                        {
                            "type": "chat.conversation_created",
                            "conversation": convo_data
                        }
                    )
                    # Trigger notification for invitees
                    if member.user != owner:
                        NotificationService.create_notification(
                            user=member.user,
                            title="Added to Group",
                            message=f"You have been added to the group chat: {title}."
                        )
        except Exception as e:
            print("Failed to broadcast group creation:", e)

        return conversation

    @staticmethod
    def archive_conversation(conversation_id, user):
        """
        Archives a conversation. Respects admin check.
        """
        conversation = Conversation.objects.get(id=conversation_id)
        
        # Check permissions
        member = ConversationMember.objects.filter(
            conversation=conversation,
            user=user,
            deleted_at__isnull=True
        ).first()
        
        is_admin_or_owner = member and member.role in [ConversationMember.ROLE_OWNER, ConversationMember.ROLE_ADMIN]
        if not is_admin_or_owner and not user.is_superuser:
            raise ValidationError("You do not have permission to archive this conversation.")

        conversation.is_archived = True
        conversation.archived_at = timezone.now()
        conversation.save(update_fields=['is_archived', 'archived_at', 'updated_at'])
        return conversation
