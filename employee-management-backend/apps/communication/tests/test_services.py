from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.communication.models.conversation import Conversation, ConversationMember
from apps.communication.models.message import Message
from apps.communication.models.call import Call
from apps.communication.models.meeting import Meeting
from apps.communication.services.conversation import ConversationService
from apps.communication.services.message import MessageService
from apps.communication.services.group import GroupService
from apps.communication.services.call import CallService
from apps.communication.services.meeting import MeetingService

User = get_user_model()

class CommunicationServicesTestCase(TestCase):
    def setUp(self):
        # Create users
        self.super_user = User.objects.create_superuser(
            email='super@yopmail.com', password='password', employee_id='EMPTEST01', first_name='Super', last_name='Admin'
        )
        self.user1 = User.objects.create_user(
            email='user1@yopmail.com', password='password', employee_id='EMPTEST02', first_name='User', last_name='One'
        )
        self.user2 = User.objects.create_user(
            email='user2@yopmail.com', password='password', employee_id='EMPTEST03', first_name='User', last_name='Two'
        )

    def test_direct_conversation_creation(self):
        # Test creation of a new direct conversation
        conversation, created = ConversationService.get_or_create_direct_conversation(self.user1, self.user2)
        self.assertTrue(created)
        self.assertEqual(conversation.type, Conversation.TYPE_DIRECT)
        self.assertEqual(conversation.members.count(), 2)

        # Test fetching the existing direct conversation (should not duplicate)
        conversation_fetched, created_fetched = ConversationService.get_or_create_direct_conversation(self.user1, self.user2)
        self.assertFalse(created_fetched)
        self.assertEqual(conversation.id, conversation_fetched.id)

    def test_group_conversation_creation(self):
        # Test creating a group conversation
        conversation = ConversationService.create_group_conversation(
            owner=self.user1,
            title="Tech Sync Group",
            description="A channel for developers",
            member_ids=[str(self.user2.id)]
        )
        self.assertEqual(conversation.type, Conversation.TYPE_GROUP)
        self.assertEqual(conversation.title, "Tech Sync Group")
        self.assertEqual(conversation.members.count(), 2)

        # Check owner assignment
        owner_member = conversation.members.get(user=self.user1)
        self.assertEqual(owner_member.role, ConversationMember.ROLE_OWNER)

    def test_send_message_and_reply(self):
        conversation, _ = ConversationService.get_or_create_direct_conversation(self.user1, self.user2)
        
        # Send a message
        msg1 = MessageService.send_message(
            sender=self.user1,
            conversation=conversation,
            text="Hello World"
        )
        self.assertEqual(msg1.text, "Hello World")
        self.assertEqual(msg1.sender, self.user1)

        # Reply to message
        msg2 = MessageService.send_message(
            sender=self.user2,
            conversation=conversation,
            text="Hey there",
            reply_to=msg1
        )
        self.assertEqual(msg2.reply_to, msg1)

    def test_soft_delete_models(self):
        conversation, _ = ConversationService.get_or_create_direct_conversation(self.user1, self.user2)
        msg = MessageService.send_message(
            sender=self.user1,
            conversation=conversation,
            text="Temporary Message"
        )
        
        # Soft delete message
        MessageService.delete_message(self.user1, msg)
        self.assertTrue(msg.is_deleted)
        self.assertEqual(msg.text, "This message was deleted")

    def test_call_workflow(self):
        conversation, _ = ConversationService.get_or_create_direct_conversation(self.user1, self.user2)
        
        # Initiate a call
        call = CallService.initiate_call(self.user1, conversation, Call.TYPE_VIDEO)
        self.assertEqual(call.status, Call.STATUS_RINGING)
        self.assertEqual(call.host, self.user1)

        # Connect / Answer call
        CallService.connect_call(call.id, self.user2)
        call.refresh_from_db()
        self.assertEqual(call.status, Call.STATUS_CONNECTED)
        self.assertTrue(call.start_time is not None)

        # End call
        CallService.end_call(call.id)
        call.refresh_from_db()
        self.assertEqual(call.status, Call.STATUS_COMPLETED)
        self.assertTrue(call.end_time is not None)

    def test_meeting_schedule(self):
        # Schedule a future meeting
        meeting_time = timezone.now() + timezone.timedelta(days=1)
        meeting = MeetingService.schedule_meeting(
            host=self.user1,
            title="Sprint Planning Meeting",
            start_time=meeting_time,
            duration=45,
            invitee_ids=[str(self.user2.id)]
        )
        self.assertEqual(meeting.title, "Sprint Planning Meeting")
        self.assertEqual(meeting.attendances.count(), 2)
