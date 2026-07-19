from django.urls import path

from .views import (
    UserCreateAPIView,
    UserListAPIView,
    UserUpdateAPIView,
    CurrentUserAPIView,
)

app_name = "users"

urlpatterns = [
    path(
        "me/",
        CurrentUserAPIView.as_view(),
        name="user-me",
    ),
    path(
        "",
        UserListAPIView.as_view(),
        name="user-list",
    ),
    path(
        "create/",
        UserCreateAPIView.as_view(),
        name="user-create",
    ),
    path(
        "<uuid:pk>/",
        UserUpdateAPIView.as_view(),
        name="user-detail",
    ),
]