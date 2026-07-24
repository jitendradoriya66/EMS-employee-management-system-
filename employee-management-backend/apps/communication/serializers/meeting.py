from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.communication.models.meeting import Meeting, MeetingAttendance
from .conversation import UserMiniSerializer

User = get_user_model()

class MeetingAttendanceSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = MeetingAttendance
        fields = ('id', 'user', 'status', 'joined_at')

class MeetingReadSerializer(serializers.ModelSerializer):
    host = UserMiniSerializer(read_only=True)
    attendances = MeetingAttendanceSerializer(many=True, read_only=True)

    class Meta:
        model = Meeting
        fields = ('id', 'title', 'description', 'host', 'start_time', 'duration', 'join_url', 'is_cancelled', 'attendances', 'created_at')

class MeetingWriteSerializer(serializers.ModelSerializer):
    invitee_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Meeting
        fields = ('id', 'title', 'description', 'start_time', 'duration', 'join_url', 'invitee_ids')
        read_only_fields = ('id',)

    def validate_start_time(self, value):
        from django.utils import timezone
        if value < timezone.now():
            raise serializers.ValidationError("Meeting start time must be in the future.")
        return value
