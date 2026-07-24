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

    class Meta:
        model = ConversationMember
        fields = ('id', 'user', 'user_id', 'role', 'is_muted', 'muted_until', 'joined_at')
        read_only_fields = ('role', 'is_muted', 'muted_until', 'joined_at')

class ConversationListSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Conversation
        fields = ('id', 'type', 'title', 'description', 'is_archived', 'member_count', 'created_at', 'updated_at')

class ConversationDetailSerializer(serializers.ModelSerializer):
    members = ConversationMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ('id', 'type', 'title', 'description', 'is_archived', 'archived_at', 'members', 'created_at', 'updated_at')

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
