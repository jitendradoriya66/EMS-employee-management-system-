from rest_framework import permissions

def get_user_role(user):
    if not user.is_authenticated:
        return 'guest'
    if user.is_superuser:
        return 'super_admin'
    return getattr(user, 'role', 'employee')

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to super admins.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser

class IsAdminRole(permissions.BasePermission):
    """
    Allows access to Super Admins and HR/Admins.
    """
    def has_permission(self, request, view):
        role = get_user_role(request.user)
        return role in ['super_admin', 'admin_hr']

class IsGroupOwnerOrAdmin(permissions.BasePermission):
    """
    Allows access if the user is the owner or admin of the conversation.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Super admin bypass
        if request.user.is_superuser:
            return True
            
        # Try to resolve conversation member mapping
        from apps.communication.models.conversation import ConversationMember, Conversation
        conversation = obj
        if not isinstance(conversation, Conversation) and hasattr(obj, 'conversation'):
            conversation = obj.conversation
            
        member = ConversationMember.objects.filter(
            conversation=conversation, 
            user=request.user,
            deleted_at__isnull=True
        ).first()
        
        if member:
            return member.role in [ConversationMember.ROLE_OWNER, ConversationMember.ROLE_ADMIN]
        return False

class IsConversationParticipant(permissions.BasePermission):
    """
    Allows access only if the user is a participant in the conversation.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
            
        # Super admin bypass
        if request.user.is_superuser:
            return True

        from apps.communication.models.conversation import ConversationMember, Conversation
        conversation = obj
        if not isinstance(conversation, Conversation) and hasattr(obj, 'conversation'):
            conversation = obj.conversation

        return ConversationMember.objects.filter(
            conversation=conversation,
            user=request.user,
            deleted_at__isnull=True
        ).exists()

class IsHRRole(permissions.BasePermission):
    def has_permission(self, request, view):
        role = get_user_role(request.user)
        return role in ['super_admin', 'admin_hr']

class IsEmployeeRole(permissions.BasePermission):
    def has_permission(self, request, view):
        role = get_user_role(request.user)
        return role in ['super_admin', 'admin_hr', 'employee']
