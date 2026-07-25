import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from apps.communication.models.conversation import ConversationMember

User = get_user_model()

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Extract JWT token from connection query params
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break

        self.user = await self.get_user_from_token(token)
        if self.user is None or not self.user.is_authenticated:
            await self.close(code=4001)  # Authentication failed
            return

        # Add to global system group and user-specific group
        self.user_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        # User is online, update online presence
        await self.update_user_online_status(self.user, is_online=True)

        # Connect user to all their conversations
        self.conversations = await self.get_user_conversation_ids(self.user)
        for conversation_id in self.conversations:
            await self.channel_layer.group_add(
                f"conversation_{conversation_id}",
                self.channel_name
            )

        # Broadcast presence connection to all user's conversations
        if self.channel_layer:
            for conversation_id in self.conversations:
                await self.channel_layer.group_send(
                    f"conversation_{conversation_id}",
                    {
                        "type": "chat.presence",
                        "user_id": str(self.user.id),
                        "email": self.user.email,
                        "is_online": True
                    }
                )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user is not None and self.user.is_authenticated:
            # User is offline, update presence
            await self.update_user_online_status(self.user, is_online=False)

            # Leave conversation groups and broadcast offline presence
            if self.channel_layer:
                for conversation_id in self.conversations:
                    await self.channel_layer.group_send(
                        f"conversation_{conversation_id}",
                        {
                            "type": "chat.presence",
                            "user_id": str(self.user.id),
                            "email": self.user.email,
                            "is_online": False
                        }
                    )
                    await self.channel_layer.group_discard(
                        f"conversation_{conversation_id}",
                        self.channel_name
                    )
            
            # Leave user specific group
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        event_type = content.get('type')
        conversation_id = content.get('conversation_id')

        if not event_type or not conversation_id:
            return

        # Validate conversation membership
        is_member = await self.check_membership(self.user, conversation_id)
        if not is_member:
            await self.send_json({"error": "You are not a member of this conversation."})
            return

        # Handle events
        if event_type == 'typing':
            is_typing = content.get('is_typing', False)
            await self.channel_layer.group_send(
                f"conversation_{conversation_id}",
                {
                    "type": "chat.typing",
                    "conversation_id": conversation_id,
                    "user_id": str(self.user.id),
                    "user_name": f"{self.user.first_name} {self.user.last_name}".strip(),
                    "is_typing": is_typing
                }
            )
        elif event_type == 'read_receipt':
            message_id = content.get('message_id')
            if message_id:
                # Mark as read in DB
                await self.mark_db_message_read(self.user, message_id)
                await self.channel_layer.group_send(
                    f"conversation_{conversation_id}",
                    {
                        "type": "chat.read_receipt",
                        "conversation_id": conversation_id,
                        "message_id": message_id,
                        "user_id": str(self.user.id),
                        "status": "read"
                    }
                )
        elif event_type == 'rtc_signal':
            signal_data = content.get('signal_data')
            await self.channel_layer.group_send(
                f"conversation_{conversation_id}",
                {
                    "type": "chat.rtc_signal",
                    "conversation_id": conversation_id,
                    "sender_id": str(self.user.id),
                    "signal_data": signal_data
                }
            )

    # Group event handlers
    async def chat_typing(self, event):
        await self.send_json({
            "type": "typing",
            "conversation_id": event["conversation_id"],
            "user_id": event["user_id"],
            "user_name": event["user_name"],
            "is_typing": event["is_typing"]
        })

    async def chat_read_receipt(self, event):
        await self.send_json({
            "type": "read_receipt",
            "conversation_id": event["conversation_id"],
            "message_id": event["message_id"],
            "user_id": event["user_id"],
            "status": event["status"]
        })

    async def chat_message(self, event):
        # Forward new message payload in real-time
        await self.send_json({
            "type": "message",
            "message": event["message"]
        })

    async def chat_call(self, event):
        # Forward new call payload in real-time
        await self.send_json({
            "type": "call",
            "call_data": event["call_data"]
        })

    async def chat_call_answered(self, event):
        # Forward call answered event in real-time
        await self.send_json({
            "type": "call_answered",
            "call_data": event["call_data"]
        })

    async def chat_call_rejected(self, event):
        # Forward call rejected event in real-time
        await self.send_json({
            "type": "call_rejected",
            "call_data": event["call_data"]
        })

    async def chat_call_ended(self, event):
        # Forward call ended event in real-time
        await self.send_json({
            "type": "call_ended",
            "call_data": event["call_data"]
        })

    async def chat_read_all(self, event):
        # Forward read all event in real-time
        await self.send_json({
            "type": "read_all",
            "conversation_id": event["conversation_id"],
            "user_id": event["user_id"]
        })

    async def chat_presence(self, event):
        # Forward user presence event in real-time
        await self.send_json({
            "type": "presence",
            "user_id": event["user_id"],
            "email": event["email"],
            "is_online": event["is_online"]
        })

    async def chat_rtc_signal(self, event):
        # Forward WebRTC signaling payload in real-time
        await self.send_json({
            "type": "rtc_signal",
            "conversation_id": event["conversation_id"],
            "sender_id": event["sender_id"],
            "signal_data": event["signal_data"]
        })

    # DB Operations (async wrappers)
    @database_sync_to_async
    def get_user_from_token(self, token):
        if not token:
            return None
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except Exception:
            return None

    @database_sync_to_async
    def get_user_conversation_ids(self, user):
        memberships = ConversationMember.objects.filter(user=user, deleted_at__isnull=True)
        return list(memberships.values_list('conversation_id', flat=True))

    @database_sync_to_async
    def check_membership(self, user, conversation_id):
        return ConversationMember.objects.filter(
            conversation_id=conversation_id,
            user=user,
            deleted_at__isnull=True
        ).exists()

    @database_sync_to_async
    def update_user_online_status(self, user, is_online):
        from django.core.cache import cache
        cache_key = f"user_online_{user.id}"
        if is_online:
            cache.set(cache_key, True, 600)  # Active presence TTL of 10 minutes
        else:
            cache.delete(cache_key)

    @database_sync_to_async
    def mark_db_message_read(self, user, message_id):
        from apps.communication.models.message import Message, MessageReceipt
        from django.utils import timezone
        try:
            msg = Message.objects.get(id=message_id)
            receipt, created = MessageReceipt.objects.get_or_create(
                message=msg,
                user=user,
                defaults={'status': MessageReceipt.STATUS_READ, 'read_at': timezone.now()}
            )
            if not created and receipt.status != MessageReceipt.STATUS_READ:
                receipt.status = MessageReceipt.STATUS_READ
                receipt.read_at = timezone.now()
                receipt.save(update_fields=['status', 'read_at', 'updated_at'])
        except Exception:
            pass

