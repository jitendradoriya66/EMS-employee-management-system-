from django.core.cache import cache
from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.communication.models.conversation import Conversation, ConversationMember

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'employee_id')

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class ConversationMemberSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        source='user',
        write_only=True
    )
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = ConversationMember
        fields = ('id', 'user', 'user_id', 'role', 'is_muted', 'muted_until', 'joined_at', 'is_online')
        read_only_fields = ('role', 'is_muted', 'muted_until', 'joined_at')

    def get_is_online(self, obj):
        if obj.user:
            return bool(cache.get(f"user_online_{obj.user.id}"))
        return False

class ConversationListSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    members = ConversationMemberSerializer(many=True, read_only=True)
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'type', 'title', 'description', 'is_archived', 'member_count', 'members', 'created_at', 'updated_at', 'unread_count', 'last_message')

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return 0
        from apps.communication.models.message import Message, MessageReceipt
        unread_messages = Message.objects.filter(
            conversation=obj,
            deleted_at__isnull=True
        ).exclude(
            sender=request.user
        ).exclude(
            receipts__user=request.user,
            receipts__status=MessageReceipt.STATUS_READ
        )
        return unread_messages.count()

    def get_last_message(self, obj):
        from apps.communication.serializers.message import MessageReadSerializer
        last_msg = obj.messages.filter(deleted_at__isnull=True).order_by('-created_at').first()
        if last_msg:
            return MessageReadSerializer(last_msg, context=self.context).data
        return None

class ConversationDetailSerializer(serializers.ModelSerializer):
    members = ConversationMemberSerializer(many=True, read_only=True)
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'type', 'title', 'description', 'is_archived', 'archived_at', 'members', 'created_at', 'updated_at', 'unread_count', 'last_message')

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return 0
        from apps.communication.models.message import Message, MessageReceipt
        unread_messages = Message.objects.filter(
            conversation=obj,
            deleted_at__isnull=True
        ).exclude(
            sender=request.user
        ).exclude(
            receipts__user=request.user,
            receipts__status=MessageReceipt.STATUS_READ
        )
        return unread_messages.count()

    def get_last_message(self, obj):
        from apps.communication.serializers.message import MessageReadSerializer
        last_msg = obj.messages.filter(deleted_at__isnull=True).order_by('-created_at').first()
        if last_msg:
            return MessageReadSerializer(last_msg, context=self.context).data
        return None

class ConversationCreateSerializer(serializers.ModelSerializer):
    member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Conversation
        fields = ('id', 'type', 'title', 'description', 'member_ids')
        read_only_fields = ('id',)

    def validate(self, attrs):
        conv_type = attrs.get('type', Conversation.TYPE_DIRECT)
        if conv_type == Conversation.TYPE_DIRECT:
            member_ids = attrs.get('member_ids', [])
            if len(member_ids) != 1:
                raise serializers.ValidationError("A direct conversation must invite exactly one other user.")
        return attrs

