from django.utils import timezone
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from apps.communication.models.conversation import Conversation, ConversationMember

User = get_user_model()

class GroupService:
    @staticmethod
    def add_member(admin_user, conversation, user_to_add, role=ConversationMember.ROLE_MEMBER):
        """
        Adds a member to a group chat. Requires admin privileges.
        """
        if conversation.type != Conversation.TYPE_GROUP:
            raise ValidationError("Cannot add members to a direct message conversation.")

        # Check if caller is admin
        caller_membership = ConversationMember.objects.filter(
            conversation=conversation,
            user=admin_user,
            deleted_at__isnull=True
        ).first()
        
        is_authorized = admin_user.is_superuser or (caller_membership and caller_membership.role in [ConversationMember.ROLE_OWNER, ConversationMember.ROLE_ADMIN])
        if not is_authorized:
            raise ValidationError("Only group owners or admins can add members.")

        # Max member check
        if conversation.members.count() >= 100:
            raise ValidationError("Group has reached the maximum limit of 100 members.")

        # Duplicate check
        if ConversationMember.objects.filter(conversation=conversation, user=user_to_add, deleted_at__isnull=True).exists():
            raise ValidationError("User is already a member of this group.")

        # Add or restore membership
        member, created = ConversationMember.objects.get_or_create(
            conversation=conversation,
            user=user_to_add,
            defaults={'role': role, 'joined_at': timezone.now()}
        )
        if not created:
            member.deleted_at = None
            member.role = role
            member.joined_at = timezone.now()
            member.save(update_fields=['deleted_at', 'role', 'joined_at', 'updated_at'])
            
        return member

    @staticmethod
    def remove_member(admin_user, conversation, user_to_remove):
        """
        Removes a member from a group chat. Requires admin privileges.
        """
        if conversation.type != Conversation.TYPE_GROUP:
            raise ValidationError("Cannot remove members from a direct message conversation.")

        caller_membership = ConversationMember.objects.filter(
            conversation=conversation,
            user=admin_user,
            deleted_at__isnull=True
        ).first()

        is_authorized = admin_user.is_superuser or (caller_membership and caller_membership.role in [ConversationMember.ROLE_OWNER, ConversationMember.ROLE_ADMIN])
        if not is_authorized:
            raise ValidationError("Only group owners or admins can remove members.")

        target_membership = ConversationMember.objects.filter(
            conversation=conversation,
            user=user_to_remove,
            deleted_at__isnull=True
        ).first()

        if not target_membership:
            raise ValidationError("User is not a member of this group.")

        if target_membership.role == ConversationMember.ROLE_OWNER:
            raise ValidationError("Cannot remove the owner of the group.")

        target_membership.delete()

    @staticmethod
    def leave_group(user, conversation):
        """
        Allows a user to leave a group chat.
        """
        if conversation.type != Conversation.TYPE_GROUP:
            raise ValidationError("Cannot leave a direct conversation.")

        membership = ConversationMember.objects.filter(
            conversation=conversation,
            user=user,
            deleted_at__isnull=True
        ).first()

        if not membership:
            raise ValidationError("You are not a member of this group.")

        if membership.role == ConversationMember.ROLE_OWNER:
            # If owner wants to leave, they must transfer ownership or delete the group
            raise ValidationError("Owner cannot leave without transferring ownership.")

        membership.delete()

    @staticmethod
    def mute_member(admin_user, conversation, user_to_mute, duration_minutes=None):
        """
        Mutes a member. Requires admin privileges.
        """
        caller_membership = ConversationMember.objects.filter(
            conversation=conversation,
            user=admin_user,
            deleted_at__isnull=True
        ).first()

        is_authorized = admin_user.is_superuser or (caller_membership and caller_membership.role in [ConversationMember.ROLE_OWNER, ConversationMember.ROLE_ADMIN])
        if not is_authorized:
            raise ValidationError("Only group owners or admins can mute members.")

        target_membership = ConversationMember.objects.filter(
            conversation=conversation,
            user=user_to_mute,
            deleted_at__isnull=True
        ).first()

        if not target_membership:
            raise ValidationError("User is not a member of this group.")

        target_membership.is_muted = True
        if duration_minutes:
            target_membership.muted_until = timezone.now() + timezone.timedelta(minutes=duration_minutes)
        else:
            target_membership.muted_until = None
            
        target_membership.save(update_fields=['is_muted', 'muted_until', 'updated_at'])
        return target_membership
