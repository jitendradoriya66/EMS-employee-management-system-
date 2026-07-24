from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.communication.models.message import Message, MessageReceipt, MessageReaction
from .conversation import UserMiniSerializer

User = get_user_model()

class MessageReceiptSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = MessageReceipt
        fields = ('id', 'user', 'status', 'read_at')

class MessageReactionSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = MessageReaction
        fields = ('id', 'user', 'emoji')

class MessageReadSerializer(serializers.ModelSerializer):
    sender = UserMiniSerializer(read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)
    receipts = MessageReceiptSerializer(many=True, read_only=True)
    reply_to_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Message
        fields = (
            'id', 'conversation', 'sender', 'text', 'file_path', 'file_type',
            'reply_to', 'reply_to_details', 'reactions', 'receipts',
            'is_edited', 'is_deleted', 'created_at', 'updated_at'
        )

    def get_reply_to_details(self, obj):
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'sender_name': f"{obj.reply_to.sender.first_name} {obj.reply_to.sender.last_name}".strip(),
                'text': obj.reply_to.text[:50] if obj.reply_to.text else "[Attachment]"
            }
        return None

class MessageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('id', 'conversation', 'text', 'file_path', 'file_type', 'reply_to')
        read_only_fields = ('id',)

    def validate(self, attrs):
        text = attrs.get('text')
        file_path = attrs.get('file_path')
        if not text and not file_path:
            raise serializers.ValidationError("Message must contain text or attachment path.")
        return attrs
