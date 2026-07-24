from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from apps.communication.models.meeting import Meeting, MeetingAttendance

User = get_user_model()

class MeetingService:
    @staticmethod
    def schedule_meeting(host, title, start_time, duration=30, description=None, invitee_ids=None, join_url=None):
        """
        Schedules a new meeting.
        """
        if not title:
            raise ValidationError("Meeting title is required.")
        if start_time < timezone.now():
            raise ValidationError("Meeting start time must be in the future.")

        invitee_ids = invitee_ids or []
        
        with transaction.atomic():
            meeting = Meeting.objects.create(
                title=title,
                description=description,
                host=host,
                start_time=start_time,
                duration=duration,
                join_url=join_url
            )

            # Auto add host as joined participant
            MeetingAttendance.objects.create(
                meeting=meeting,
                user=host,
                status=MeetingAttendance.STATUS_JOINED,
                joined_at=timezone.now()
            )

            # Invite other users
            active_invitees = User.objects.filter(id__in=invitee_ids, is_active=True)
            for invitee in active_invitees:
                if invitee != host:
                    MeetingAttendance.objects.create(
                        meeting=meeting,
                        user=invitee,
                        status=MeetingAttendance.STATUS_INVITED
                    )

        return meeting

    @staticmethod
    def join_meeting(meeting_id, user):
        """
        Registers a user as joined in the meeting.
        """
        meeting = Meeting.objects.get(id=meeting_id)
        if meeting.is_cancelled:
            raise ValidationError("Cannot join a cancelled meeting.")

        attendance, created = MeetingAttendance.objects.get_or_create(
            meeting=meeting,
            user=user,
            defaults={'status': MeetingAttendance.STATUS_JOINED, 'joined_at': timezone.now()}
        )
        if not created and attendance.status != MeetingAttendance.STATUS_JOINED:
            attendance.status = MeetingAttendance.STATUS_JOINED
            attendance.joined_at = timezone.now()
            attendance.save(update_fields=['status', 'joined_at', 'updated_at'])
            
        return attendance

    @staticmethod
    def cancel_meeting(meeting_id, host_user):
        """
        Cancels a meeting. Only allowed by host or superuser.
        """
        meeting = Meeting.objects.get(id=meeting_id)
        if meeting.host != host_user and not host_user.is_superuser:
            raise ValidationError("Only the meeting host can cancel this meeting.")

        meeting.is_cancelled = True
        meeting.save(update_fields=['is_cancelled', 'updated_at'])
        return meeting
