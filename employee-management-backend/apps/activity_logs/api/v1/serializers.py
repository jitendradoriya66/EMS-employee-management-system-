from rest_framework import serializers
from apps.activity_logs.models.activity_log import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'
