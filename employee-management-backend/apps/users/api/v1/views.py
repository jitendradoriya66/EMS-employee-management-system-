from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth import get_user_model

from .serializers import (
    UserCreateSerializer,
    UserListSerializer,
    UserUpdateSerializer,
    CurrentUserSerializer,
)

User = get_user_model()


class UserCreateAPIView(generics.CreateAPIView):
    """
    API for creating a new user.
    """

    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [IsAuthenticated]


class UserListAPIView(generics.ListAPIView):
    """
    API for listing all users.
    """

    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]


class UserUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API for updating and deleting a user (e.g. status, roles).
    """

    queryset = User.objects.all()
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated]

class CurrentUserAPIView(generics.RetrieveUpdateAPIView):
    """
    API for retrieving and updating the authenticated user's own profile.
    """
    serializer_class = CurrentUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user