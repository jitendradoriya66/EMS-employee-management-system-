from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from apps.communication.models.conversation import Conversation, ConversationMember
from apps.communication.models.message import Message
from apps.communication.models.call import Call
from apps.communication.models.meeting import Meeting
from apps.communication.models.notification import CommunicationNotification

from apps.communication.serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    ConversationCreateSerializer,
    MessageReadSerializer,
    MessageWriteSerializer,
    CallReadSerializer,
    CallWriteSerializer,
    MeetingReadSerializer,
    MeetingWriteSerializer,
    CommunicationNotificationSerializer
)

from apps.communication.permissions.custom import (
    IsConversationParticipant,
    IsGroupOwnerOrAdmin,
    IsHRRole,
    IsEmployeeRole,
    get_user_role
)

from apps.communication.services.conversation import ConversationService
from apps.communication.services.message import MessageService
from apps.communication.services.group import GroupService
from apps.communication.services.call import CallService
from apps.communication.services.meeting import MeetingService
from apps.communication.services.notification import NotificationService

class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsEmployeeRole]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'is_archived']
    search_fields = ['title', 'description', 'members__user__first_name', 'members__user__last_name']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        # Users can only view conversations they are part of
        return Conversation.objects.filter(
            members__user=self.request.user,
            deleted_at__isnull=True
        ).prefetch_related(
            Prefetch('members', queryset=ConversationMember.objects.select_related('user').filter(deleted_at__isnull=True))
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        elif self.action == 'retrieve':
            return ConversationDetailSerializer
        elif self.action == 'create':
            return ConversationCreateSerializer
        return ConversationDetailSerializer

    def get_permissions(self):
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsConversationParticipant()]
        return super().get_permissions()

    def destroy(self, request, *args, **kwargs):
        role = get_user_role(request.user)
        if role == 'employee':
            return Response(
                {"detail": "Employees do not have permission to delete conversations."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conv_type = serializer.validated_data.get('type', Conversation.TYPE_DIRECT)
        
        if conv_type == Conversation.TYPE_DIRECT:
            invited_user_id = serializer.validated_data['member_ids'][0]
            from django.contrib.auth import get_user_model
            invited_user = get_object_or_404(get_user_model(), id=invited_user_id)
            
            conversation, created = ConversationService.get_or_create_direct_conversation(request.user, invited_user)
        else:
            # Group Conversation
            role = get_user_role(request.user)
            if role == 'employee':
                return Response(
                    {"detail": "Employees do not have permission to create group conversations."},
                    status=status.HTTP_403_FORBIDDEN
                )
            member_ids = serializer.validated_data.get('member_ids', [])
            conversation = ConversationService.create_group_conversation(
                owner=request.user,
                title=serializer.validated_data['title'],
                description=serializer.validated_data.get('description'),
                member_ids=member_ids
            )
            
        return Response(ConversationDetailSerializer(conversation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsGroupOwnerOrAdmin])
    def add_member(self, request, pk=None):
        conversation = self.get_object()
        user_id = request.data.get('user_id')
        from django.contrib.auth import get_user_model
        user_to_add = get_object_or_404(get_user_model(), id=user_id)
        role = request.data.get('role', ConversationMember.ROLE_MEMBER)
        
        member = GroupService.add_member(request.user, conversation, user_to_add, role)
        return Response({"message": f"User {user_to_add.email} added successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsGroupOwnerOrAdmin])
    def remove_member(self, request, pk=None):
        conversation = self.get_object()
        user_id = request.data.get('user_id')
        from django.contrib.auth import get_user_model
        user_to_remove = get_object_or_404(get_user_model(), id=user_id)
        
        GroupService.remove_member(request.user, conversation, user_to_remove)
        return Response({"message": f"User {user_to_remove.email} removed successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def leave(self, request, pk=None):
        conversation = self.get_object()
        GroupService.leave_group(request.user, conversation)
        return Response({"message": "You have left the group."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsGroupOwnerOrAdmin])
    def mute_member(self, request, pk=None):
        conversation = self.get_object()
        user_id = request.data.get('user_id')
        from django.contrib.auth import get_user_model
        user_to_mute = get_object_or_404(get_user_model(), id=user_id)
        duration = request.data.get('duration_minutes')
        
        GroupService.mute_member(request.user, conversation, user_to_mute, duration)
        return Response({"message": f"User {user_to_mute.email} muted successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def archive(self, request, pk=None):
        role = get_user_role(request.user)
        if role == 'employee':
            return Response(
                {"detail": "Employees do not have permission to archive conversations."},
                status=status.HTTP_403_FORBIDDEN
            )
        conversation = self.get_object()
        ConversationService.archive_conversation(conversation.id, request.user)
        return Response({"message": "Conversation archived successfully."}, status=status.HTTP_200_OK)

class MessageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsEmployeeRole]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['conversation', 'file_type', 'is_edited', 'is_deleted']
    search_fields = ['text', 'sender__first_name', 'sender__last_name']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    
    def get_queryset(self):
        # Retrieve messages for conversations user is part of
        return Message.objects.filter(
            conversation__members__user=self.request.user,
            deleted_at__isnull=True
        ).select_related('sender', 'reply_to', 'reply_to__sender').prefetch_related('reactions', 'receipts')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MessageWriteSerializer
        return MessageReadSerializer

    def perform_create(self, serializer):
        conversation = serializer.validated_data['conversation']
        # Validate member
        if not ConversationMember.objects.filter(conversation=conversation, user=self.request.user, deleted_at__isnull=True).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not a member of this conversation.")
            
        message = MessageService.send_message(
            sender=self.request.user,
            conversation=conversation,
            text=serializer.validated_data.get('text'),
            file_path=serializer.validated_data.get('file_path'),
            file_type=serializer.validated_data.get('file_type'),
            reply_to=serializer.validated_data.get('reply_to')
        )
        serializer.instance = message

    def perform_update(self, serializer):
        message = self.get_object()
        new_text = serializer.validated_data.get('text')
        updated_msg = MessageService.edit_message(self.request.user, message, new_text)
        serializer.instance = updated_msg

    def perform_destroy(self, instance):
        MessageService.delete_message(self.request.user, instance)

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        message = self.get_object()
        emoji = request.data.get('emoji')
        if not emoji:
            return Response({"error": "Emoji is required."}, status=status.HTTP_400_BAD_REQUEST)
        MessageService.add_reaction(request.user, message, emoji)
        return Response({"message": "Reaction toggled."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        MessageService.mark_as_read(request.user, message)
        return Response({"message": "Message marked as read."}, status=status.HTTP_200_OK)

class CallViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsEmployeeRole]
    
    def get_queryset(self):
        return Call.objects.filter(
            conversation__members__user=self.request.user,
            deleted_at__isnull=True
        ).select_related('host').prefetch_related('participants')

    def get_serializer_class(self):
        if self.action == 'create':
            return CallWriteSerializer
        return CallReadSerializer

    def perform_create(self, serializer):
        conversation = serializer.validated_data['conversation']
        call_type = serializer.validated_data.get('type', Call.TYPE_VOICE)
        call = CallService.initiate_call(self.request.user, conversation, call_type)
        serializer.instance = call

    @action(detail=True, methods=['post'])
    def answer(self, request, pk=None):
        call = self.get_object()
        CallService.connect_call(call.id, request.user)
        return Response({"message": "Call answered."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        call = self.get_object()
        CallService.reject_call(call.id, request.user)
        return Response({"message": "Call rejected."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        call = self.get_object()
        CallService.end_call(call.id)
        return Response({"message": "Call ended."}, status=status.HTTP_200_OK)

class MeetingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsEmployeeRole]

    def get_queryset(self):
        return Meeting.objects.filter(
            attendances__user=self.request.user,
            deleted_at__isnull=True
        ).select_related('host').prefetch_related('attendances')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MeetingWriteSerializer
        return MeetingReadSerializer

    def create(self, request, *args, **kwargs):
        role = get_user_role(request.user)
        if role == 'employee':
            return Response(
                {"detail": "Employees do not have permission to schedule meetings."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        invitee_ids = serializer.validated_data.get('invitee_ids', [])
        meeting = MeetingService.schedule_meeting(
            host=self.request.user,
            title=serializer.validated_data['title'],
            start_time=serializer.validated_data['start_time'],
            duration=serializer.validated_data.get('duration', 30),
            description=serializer.validated_data.get('description'),
            invitee_ids=invitee_ids,
            join_url=serializer.validated_data.get('join_url')
        )
        serializer.instance = meeting

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        meeting = self.get_object()
        MeetingService.join_meeting(meeting.id, request.user)
        return Response({"message": "Meeting joined successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        meeting = self.get_object()
        MeetingService.cancel_meeting(meeting.id, request.user)
        return Response({"message": "Meeting cancelled."}, status=status.HTTP_200_OK)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CommunicationNotificationSerializer

    def get_queryset(self):
        return CommunicationNotification.objects.filter(
            recipient=self.request.user,
            deleted_at__isnull=True
        )

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        NotificationService.mark_as_read(notification.id, request.user)
        return Response({"message": "Notification marked as read."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        NotificationService.mark_all_as_read(request.user)
        return Response({"message": "All notifications marked as read."}, status=status.HTTP_200_OK)
