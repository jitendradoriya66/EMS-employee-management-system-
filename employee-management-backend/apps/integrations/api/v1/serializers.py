from rest_framework import serializers
from apps.integrations.models.integration import Integration

class IntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integration
        fields = '__all__'
