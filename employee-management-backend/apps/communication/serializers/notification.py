from rest_framework import serializers
from apps.communication.models.notification import CommunicationNotification

class CommunicationNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationNotification
        fields = ('id', 'type', 'title', 'body', 'read_at', 'extra_data', 'created_at')
        read_only_fields = ('id', 'type', 'title', 'body', 'read_at', 'extra_data', 'created_at')
