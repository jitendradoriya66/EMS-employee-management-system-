from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.communication.models.call import Call, CallParticipant
from .conversation import UserMiniSerializer

User = get_user_model()

class CallParticipantSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = CallParticipant
        fields = ('id', 'user', 'joined_at', 'left_at')

class CallReadSerializer(serializers.ModelSerializer):
    host = UserMiniSerializer(read_only=True)
    participants = CallParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Call
        fields = ('id', 'conversation', 'host', 'type', 'status', 'start_time', 'end_time', 'duration', 'participants', 'created_at')

class CallWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Call
        fields = ('id', 'conversation', 'type')
        read_only_fields = ('id',)
