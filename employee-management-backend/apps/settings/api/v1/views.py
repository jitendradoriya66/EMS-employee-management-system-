from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.settings.models import UserPreference
from apps.settings.serializers.user_preference import UserPreferenceSerializer

class UserPreferenceAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj, created = UserPreference.objects.get_or_create(user=self.request.user)
        return obj
