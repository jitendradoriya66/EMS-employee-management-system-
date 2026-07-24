from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError
from apps.communication.models.call import Call, CallParticipant
from apps.communication.models.conversation import ConversationMember

class CallService:
    @staticmethod
    def initiate_call(host, conversation, call_type=Call.TYPE_VOICE):
        """
        Initiates a new voice or video call.
        """
        # Validate member
        is_member = ConversationMember.objects.filter(
            conversation=conversation,
            user=host,
            deleted_at__isnull=True
        ).exists()
        if not is_member and not host.is_superuser:
            raise ValidationError("You cannot initiate a call in this conversation.")

        with transaction.atomic():
            call = Call.objects.create(
                conversation=conversation,
                host=host,
                type=call_type,
                status=Call.STATUS_RINGING
            )
            # Add host as participant
            CallParticipant.objects.create(
                call=call,
                user=host,
                joined_at=timezone.now()
            )

        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"conversation_{conversation.id}",
                    {
                        "type": "chat.call",
                        "call_data": {
                            "id": str(call.id),
                            "type": call.type,
                            "host_id": str(host.id),
                            "host_name": f"{host.first_name} {host.last_name}".strip(),
                            "conversation_id": str(conversation.id)
                        }
                    }
                )
        except Exception:
            pass

        return call

    @staticmethod
    def connect_call(call_id, user):
        """
        Connects / Answers the call.
        """
        call = Call.objects.get(id=call_id)
        if call.status not in [Call.STATUS_RINGING, Call.STATUS_CONNECTED]:
            raise ValidationError("This call has already ended or is unavailable.")

        with transaction.atomic():
            if call.status == Call.STATUS_RINGING:
                call.status = Call.STATUS_CONNECTED
                call.start_time = timezone.now()
                call.save(update_fields=['status', 'start_time', 'updated_at'])

            # Register user as participant
            participant, created = CallParticipant.objects.get_or_create(
                call=call,
                user=user,
                defaults={'joined_at': timezone.now()}
            )
            if not created and participant.left_at:
                participant.left_at = None
                participant.joined_at = timezone.now()
                participant.save(update_fields=['left_at', 'joined_at', 'updated_at'])

        return call

    @staticmethod
    def reject_call(call_id, user):
        """
        Rejects an incoming call.
        """
        call = Call.objects.get(id=call_id)
        if call.status == Call.STATUS_RINGING:
            call.status = Call.STATUS_REJECTED
            call.end_time = timezone.now()
            call.save(update_fields=['status', 'end_time', 'updated_at'])
        return call

    @staticmethod
    def end_call(call_id):
        """
        Ends the call, sets end time, and calculates final duration.
        """
        call = Call.objects.get(id=call_id)
        if call.status == Call.STATUS_COMPLETED:
            return call

        with transaction.atomic():
            call.status = Call.STATUS_COMPLETED
            call.end_time = timezone.now()
            
            # Calculate duration
            if call.start_time:
                duration_delta = call.end_time - call.start_time
                call.duration = int(duration_delta.total_seconds())
            else:
                call.duration = 0
                
            call.save(update_fields=['status', 'end_time', 'duration', 'updated_at'])

            # Mark all active participants as left
            CallParticipant.objects.filter(call=call, left_at__isnull=True).update(
                left_at=timezone.now()
            )

        return call
