from django.db import models
from django.conf import settings
from .base import SoftDeleteModel

class Meeting(SoftDeleteModel):
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hosted_meetings', db_index=True)
    start_time = models.DateTimeField(db_index=True)
    duration = models.IntegerField(default=30)  # In minutes
    join_url = models.URLField(max_length=500, null=True, blank=True)
    is_cancelled = models.BooleanField(default=False)

    class Meta:
        db_table = 'communication_meetings'
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.title} hosted by {self.host.email}"

class MeetingAttendance(SoftDeleteModel):
    STATUS_INVITED = 'invited'
    STATUS_JOINED = 'joined'
    STATUS_ABSENT = 'absent'

    STATUS_CHOICES = (
        (STATUS_INVITED, 'Invited'),
        (STATUS_JOINED, 'Joined'),
        (STATUS_ABSENT, 'Absent'),
    )

    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='attendances', db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meeting_attendances', db_index=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_INVITED, db_index=True)
    joined_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'communication_meeting_attendance'
        unique_together = ('meeting', 'user')

    def __str__(self):
        return f"{self.user.email} - {self.status} - {self.meeting.title}"
