from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError
from apps.communication.models.message import Message, MessageReceipt, MessageReaction
from apps.communication.models.conversation import ConversationMember

class MessageService:
    @staticmethod
    def send_message(sender, conversation, text=None, file_path=None, file_type=None, reply_to=None):
        """
        Sends a new message in the conversation.
        """
        # Validate membership
        is_member = ConversationMember.objects.filter(
            conversation=conversation,
            user=sender,
            deleted_at__isnull=True
        ).exists()
        if not is_member and not sender.is_superuser:
            raise ValidationError("You are not a member of this conversation.")

        if not text and not file_path:
            raise ValidationError("Cannot send an empty message.")

        with transaction.atomic():
            message = Message.objects.create(
                conversation=conversation,
                sender=sender,
                text=text,
                file_path=file_path,
                file_type=file_type,
                reply_to=reply_to
            )

            # Auto create read receipt for sender
            MessageReceipt.objects.create(
                message=message,
                user=sender,
                status=MessageReceipt.STATUS_READ,
                read_at=timezone.now()
            )

            # Touch conversation to update ordering
            conversation.save(update_fields=['updated_at'])

        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            from apps.communication.serializers.message import MessageReadSerializer
            
            channel_layer = get_channel_layer()
            if channel_layer:
                message_data = MessageReadSerializer(message).data
                # Broadcast to conversation group
                async_to_sync(channel_layer.group_send)(
                    f"conversation_{conversation.id}",
                    {
                        "type": "chat.message",
                        "message": message_data
                    }
                )
                # Broadcast to each member's personal user group so new conversations work instantly
                for member in conversation.members.all():
                    async_to_sync(channel_layer.group_send)(
                        f"user_{member.user.id}",
                        {
                            "type": "chat.message",
                            "message": message_data
                        }
                    )
            
            # Create real-time notification records for other members of the conversation
            from apps.notifications.services.notification_service import NotificationService
            other_members = conversation.members.filter(deleted_at__isnull=True).exclude(user=sender)
            title = f"New message from {sender.first_name} {sender.last_name}" if conversation.type == 'direct' else f"New message in {conversation.title}"
            message_text = text if text else "[Attachment]"
            for member in other_members:
                NotificationService.create_notification(
                    user=member.user,
                    title=title,
                    message=message_text,
                    notification_type='personal',
                    extra_data={'conversation_id': str(conversation.id)}
                )
        except Exception as e:
            print("Failed to broadcast message via WebSocket/Notification:", e)

        return message

    @staticmethod
    def mark_as_read(user, message):
        """
        Marks a message as read by the user.
        """
        receipt, created = MessageReceipt.objects.get_or_create(
            message=message,
            user=user,
            defaults={'status': MessageReceipt.STATUS_READ, 'read_at': timezone.now()}
        )
        if not created and receipt.status != MessageReceipt.STATUS_READ:
            receipt.status = MessageReceipt.STATUS_READ
            receipt.read_at = timezone.now()
            receipt.save(update_fields=['status', 'read_at', 'updated_at'])
        return receipt

    @staticmethod
    def add_reaction(user, message, emoji):
        """
        Adds or toggles a reaction to a message.
        """
        # Check membership
        is_member = ConversationMember.objects.filter(
            conversation=message.conversation,
            user=user,
            deleted_at__isnull=True
        ).exists()
        if not is_member and not user.is_superuser:
            raise ValidationError("You are not a member of this conversation.")

        reaction, created = MessageReaction.objects.get_or_create(
            message=message,
            user=user,
            emoji=emoji
        )
        if not created:
            # Toggle: remove if already exists
            reaction.delete()
            return None
        return reaction

    @staticmethod
    def edit_message(user, message, new_text):
        """
        Edits message content (only sender allowed).
        """
        if message.sender != user:
            raise ValidationError("Only the sender can edit this message.")
        if message.is_deleted:
            raise ValidationError("Cannot edit a deleted message.")
        if not new_text:
            raise ValidationError("Message text cannot be empty.")

        message.text = new_text
        message.is_edited = True
        message.save(update_fields=['text', 'is_edited', 'updated_at'])
        return message

    @staticmethod
    def delete_message(user, message):
        """
        Soft deletes the message. Allow sender, conversation admin, or superuser.
        """
        is_sender = message.sender == user
        
        member = ConversationMember.objects.filter(
            conversation=message.conversation,
            user=user,
            deleted_at__isnull=True
        ).first()
        
        is_admin_or_owner = member and member.role in [ConversationMember.ROLE_OWNER, ConversationMember.ROLE_ADMIN]
        
        if not is_sender and not is_admin_or_owner and not user.is_superuser:
            raise ValidationError("You do not have permission to delete this message.")

        # Flag message as deleted and clear content
        message.text = "This message was deleted"
        message.file_path = None
        message.file_type = None
        message.is_deleted = True
        message.save(update_fields=['text', 'file_path', 'file_type', 'is_deleted', 'updated_at'])
        return message
