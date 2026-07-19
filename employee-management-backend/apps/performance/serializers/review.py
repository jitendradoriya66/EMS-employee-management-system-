from rest_framework import serializers
from apps.performance.models import PerformanceReview

class PerformanceReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = PerformanceReview
        fields = ("id", "employee", "reviewer", "reviewer_name", "review_date", "score", "comments", "status", "created_at")
        read_only_fields = fields

    def get_reviewer_name(self, obj):
        if obj.reviewer and obj.reviewer.user:
            return f"{obj.reviewer.user.first_name} {obj.reviewer.user.last_name}"
        return None
