from rest_framework import serializers
from apps.documents.models import Document

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ("id", "employee", "title", "file_url", "document_type", "uploaded_at")
        read_only_fields = fields
